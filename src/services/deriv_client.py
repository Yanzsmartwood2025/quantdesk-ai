import json
import httpx
import asyncio
import uuid
import time
from typing import List, Dict, Any, Optional
import websockets
from src.config import settings

class DerivClient:
    def __init__(self):
        self.app_id = settings.deriv_app_id
        self.api_token = settings.deriv_api_token
        self.rest_base_url = "https://api.derivws.com/trading/v1/options"
        self._cached_demo_account_id = None

        # Async WebSocket state
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self._reconnect_lock = asyncio.Lock()
        self._connected = asyncio.Event()
        self._futures: Dict[str, asyncio.Future] = {}

        # Background tasks
        self._listen_task: Optional[asyncio.Task] = None

        # Tick streaming state
        self.active_subscriptions: set = set() # Store symbols we are subscribed to

        # Memory structure for current candles
        # { instrument: { timeframe: { 'time': epoch, 'open': float, 'high': float, 'low': float, 'close': float, 'is_closed': bool } } }
        self.current_candles: Dict[str, Dict[str, Dict[str, Any]]] = {}

        # Queue for closed candles that need to be flushed to the database
        self.candles_to_flush: List[Dict[str, Any]] = []

        self.TF_INTERVALS = {
            "M1": 60,
            "M5": 300,
            "M15": 900,
            "M30": 1800,
            "H1": 3600,
            "H4": 14400,
            "D1": 86400
        }

    async def _get_demo_account_id(self) -> Optional[str]:
        if self._cached_demo_account_id:
            return self._cached_demo_account_id

        if not self.app_id or not self.api_token:
            return None

        headers = {
            "Deriv-App-ID": self.app_id,
            "Authorization": f"Bearer {self.api_token.strip()}"
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{self.rest_base_url}/accounts", headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    accounts = data.get("data", [])
                    for account in accounts:
                        if account.get("account_type") == "demo":
                            self._cached_demo_account_id = account.get("account_id")
                            return self._cached_demo_account_id
                else:
                    print(f"Error fetching accounts: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Exception fetching accounts: {e}")
        return None

    async def _get_otp_url(self, account_id: str) -> Optional[str]:
        headers = {
            "Deriv-App-ID": self.app_id,
            "Authorization": f"Bearer {self.api_token.strip()}"
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(f"{self.rest_base_url}/accounts/{account_id}/otp", headers=headers, timeout=10.0)
                if resp.status_code == 201 or resp.status_code == 200:
                    data = resp.json()
                    if "data" in data and "url" in data["data"]:
                        return data["data"]["url"]
                    elif "data" in data and "otp" in data["data"]:
                        return f"wss://api.derivws.com/trading/v1/options/ws/demo?otp={data['data']['otp']}"
                    elif "url" in data:
                        return data["url"]
                    elif "otp" in data:
                        return f"wss://api.derivws.com/trading/v1/options/ws/demo?otp={data['otp']}"
                    else:
                        print(f"Unexpected OTP response format: {data}")
                else:
                    print(f"Error fetching OTP: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Exception fetching OTP: {e}")
        return None

    async def connect(self):
        """Establish persistent connection and start listening loop."""
        async with self._reconnect_lock:
            if self.ws and not self.ws.closed:
                return

            self._connected.clear()

            account_id = await self._get_demo_account_id()
            if not account_id:
                print("Could not retrieve demo account ID.")
                return

            ws_url = await self._get_otp_url(account_id)
            if not ws_url:
                print("Could not retrieve WebSocket OTP URL.")
                return

            try:
                self.ws = await websockets.connect(ws_url, ping_interval=30, ping_timeout=10)
                self._connected.set()
                print("[DERIV] WebSocket connected successfully.")

                # Start listener if not running or if it was cancelled
                if not self._listen_task or self._listen_task.done():
                    self._listen_task = asyncio.create_task(self._listen_loop())

                # Resubscribe to active symbols if we are reconnecting
                if self.active_subscriptions:
                    await self._resubscribe_all()

            except Exception as e:
                print(f"[DERIV] Error connecting to WebSocket: {e}")
                self.ws = None

    async def _resubscribe_all(self):
        """Re-subscribe to ticks for all instruments after a reconnect."""
        for symbol in list(self.active_subscriptions):
            req = {
                "ticks": symbol,
                "subscribe": 1
            }
            # Fire and forget re-subscribe
            asyncio.create_task(self._send_receive(req))

    async def _listen_loop(self):
        """Continuously listens for messages on the WebSocket."""
        while True:
            await self._connected.wait()
            try:
                if self.ws:
                    async for message in self.ws:
                        self._handle_message(message)
            except websockets.exceptions.ConnectionClosed:
                print("[DERIV] WebSocket connection closed unexpectedly. Reconnecting...")
            except Exception as e:
                print(f"[DERIV] Error in listen loop: {e}")

            # Connection dropped, cleanup and reconnect
            self._connected.clear()

            # Cancel all pending futures
            for req_id, future in self._futures.items():
                if not future.done():
                    future.set_exception(Exception("Connection closed"))
            self._futures.clear()

            # Keep trying to reconnect if connect() failed (e.g. network blip fetching OTP)
            while not self._connected.is_set():
                await asyncio.sleep(2) # Backoff before reconnect
                await self.connect()

    def _handle_message(self, message: str):
        try:
            data = json.loads(message)

            # Handle standard responses with req_id
            if "req_id" in data:
                req_id = str(data["req_id"])
                if req_id in self._futures:
                    if not self._futures[req_id].done():
                        self._futures[req_id].set_result(data)
                    # We don't delete from _futures here because some subscriptions (like ticks)
                    # send continuous updates with the same req_id if we passed one.
                    # Actually, for standard send_receive, we delete it.

            # Handle tick streams (regardless of req_id)
            if data.get("msg_type") == "tick" and "tick" in data:
                self._process_tick(data["tick"])

        except Exception as e:
            print(f"[DERIV] Error parsing message: {e}")

    def _process_tick(self, tick_data: Dict[str, Any]):
        """Updates the forming candles with incoming tick data."""
        symbol = tick_data.get("symbol")
        quote = float(tick_data.get("quote", 0.0))
        epoch = int(tick_data.get("epoch", 0))

        if not symbol or not quote or not epoch:
            return

        # Unmap symbol to our instrument format if needed (e.g. frxEURUSD -> EUR_USD)
        instrument = self._unmap_instrument(symbol)

        if instrument not in self.current_candles:
            self.current_candles[instrument] = {}

        # Update for each timeframe
        for tf, interval in self.TF_INTERVALS.items():
            # Calculate the start time of the current candle based on interval
            candle_start_time = epoch - (epoch % interval)

            if tf not in self.current_candles[instrument]:
                # Initialize new candle
                self.current_candles[instrument][tf] = {
                    "time": str(candle_start_time),
                    "open": quote,
                    "high": quote,
                    "low": quote,
                    "close": quote,
                    "is_closed": False
                }
            else:
                current = self.current_candles[instrument][tf]

                # Check if we crossed into a new candle
                if int(current["time"]) < candle_start_time:
                    # Previous candle is now closed
                    current["is_closed"] = True
                    # Append it to the flush queue so it isn't lost before the 5s loop runs
                    self.candles_to_flush.append({
                        "instrument": instrument,
                        "timeframe": tf,
                        "data": current.copy()
                    })

                    # Start new candle
                    self.current_candles[instrument][tf] = {
                        "time": str(candle_start_time),
                        "open": quote,
                        "high": quote,
                        "low": quote,
                        "close": quote,
                        "is_closed": False
                    }
                else:
                    # Update current candle
                    if quote > current["high"]:
                        current["high"] = quote
                    if quote < current["low"]:
                        current["low"] = quote
                    current["close"] = quote

    async def _send_receive(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sends a request and awaits its specific response."""
        if not self.app_id:
            return {}

        await self._connected.wait()

        req_id = str(uuid.uuid4())
        request_data["req_id"] = req_id

        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self._futures[req_id] = future

        try:
            if self.ws:
                await self.ws.send(json.dumps(request_data))
                # Wait for response with timeout
                response = await asyncio.wait_for(future, timeout=15.0)
                return response
        except asyncio.TimeoutError:
            print(f"[DERIV] Request {req_id} timed out.")
            return {}
        except Exception as e:
            print(f"[DERIV] Error sending request: {e}")
            return {}
        finally:
            if req_id in self._futures:
                del self._futures[req_id]

        return {}

    def _map_instrument(self, instrument: str) -> str:
        if instrument in settings.parsed_pairs:
            parts = instrument.split("_")
            if len(parts) == 2:
                return f"frx{parts[0]}{parts[1]}"
        return instrument

    def _unmap_instrument(self, symbol: str) -> str:
        """Converts Deriv symbol back to internal format (e.g. frxEURUSD -> EUR_USD)."""
        if symbol.startswith("frx"):
            base = symbol[3:6]
            quote = symbol[6:9]
            if base and quote:
                # Check if it matches a known pair to be safe
                potential_pair = f"{base}_{quote}"
                if potential_pair in settings.parsed_pairs:
                    return potential_pair
        return symbol

    async def subscribe_ticks(self, instrument: str):
        """Subscribes to live ticks for an instrument."""
        deriv_symbol = self._map_instrument(instrument)
        if deriv_symbol not in self.active_subscriptions:
            self.active_subscriptions.add(deriv_symbol)
            req = {
                "ticks": deriv_symbol,
                "subscribe": 1
            }
            # We don't await the result, just send it
            asyncio.create_task(self._send_receive(req))
            print(f"[DERIV] Subscribed to ticks for {instrument} ({deriv_symbol})")

    async def get_active_synthetics(self) -> List[Dict[str, Any]]:
        """Obtiene la lista completa de índices sintéticos de Deriv."""
        req = {
            "active_symbols": "full",
            "product_type": "basic"
        }
        data = await self._send_receive(req)
        active_symbols = data.get("active_symbols", [])

        synthetics = []
        for symbol in active_symbols:
            if symbol.get("market") == "synthetic_index":
                synthetics.append(symbol)

        return synthetics

    async def get_multi_timeframe_candles(self, instrument: str, timeframes: List[str] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"], count: int = 10) -> Dict[str, Any]:
        results = {}
        deriv_symbol = self._map_instrument(instrument)

        tf_map = {
            "M1": 60,
            "M5": 300,
            "M15": 900,
            "M30": 1800,
            "H1": 3600,
            "H4": 14400,
            "D1": 86400
        }

        for tf in timeframes:
            try:
                granularity = tf_map.get(tf, 86400)
                req = {
                    "ticks_history": deriv_symbol,
                    "adjust_start_time": 1,
                    "count": count,
                    "end": "latest",
                    "style": "candles",
                    "granularity": granularity
                }
                data = await self._send_receive(req)

                formatted_candles = []
                if "candles" in data:
                    for c in data["candles"]:
                        formatted_candles.append({
                            "time": str(c["epoch"]),
                            "open": float(c["open"]),
                            "high": float(c["high"]),
                            "low": float(c["low"]),
                            "close": float(c["close"]),
                            "volume": 0
                        })
                results[tf] = formatted_candles
            except Exception as e:
                print(f"Error fetching candles for {instrument} ({tf}): {e}")
                results[tf] = []

        return results

    async def get_closed_trades(self, count: int = 50) -> List[Dict[str, Any]]:
        req = {
            "statement": 1,
            "description": 1,
            "limit": count
        }
        data = await self._send_receive(req)

        formatted_trades = []
        if "statement" in data and "transactions" in data["statement"]:
            for tx in data["statement"]["transactions"]:
                if tx.get("action_type") == "sell":
                    formatted_trades.append({
                        "id": str(tx.get("contract_id")),
                        "instrument": tx.get("shortcode", "").split("_")[1] if tx.get("shortcode") else "UNKNOWN",
                        "realizedPL": float(tx.get("amount", 0)),
                        "clientExtensions": {}
                    })
        return formatted_trades

    async def get_open_trades_count(self) -> int:
        req = {
            "portfolio": 1
        }
        data = await self._send_receive(req)
        if "portfolio" in data and "contracts" in data["portfolio"]:
            return len(data["portfolio"]["contracts"])
        return 0

    async def place_market_order(self, instrument: str, units: int, stop_loss_price: float, take_profit_price: float, setup_tag: str = "UNKNOWN_SETUP") -> Dict[str, Any]:
        deriv_symbol = self._map_instrument(instrument)
        amount = abs(units)
        contract_type = "CALL" if units > 0 else "PUT"

        req = {
            "buy": 1,
            "price": amount,
            "parameters": {
                "amount": amount,
                "basis": "stake",
                "contract_type": contract_type,
                "currency": "USD",
                "symbol": deriv_symbol,
                "duration": 5,
                "duration_unit": "t"
            }
        }

        try:
            return await self._send_receive(req)
        except Exception as e:
            print(f"Error placing order for {instrument}: {e}")
            return {}

# Global instance
deriv = DerivClient()
