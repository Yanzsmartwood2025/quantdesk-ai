import json
import httpx
from typing import List, Dict, Any, Optional
import websocket
from src.config import settings

class DerivClient:
    def __init__(self):
        self.app_id = settings.deriv_app_id
        self.api_token = settings.deriv_api_token
        self.rest_base_url = "https://api.derivws.com/trading/v1/options"
        self._cached_demo_account_id = None

    def _get_demo_account_id(self) -> Optional[str]:
        if self._cached_demo_account_id:
            return self._cached_demo_account_id

        if not self.app_id or not self.api_token:
            return None

        headers = {
            "Deriv-App-ID": self.app_id,
            "Authorization": f"Bearer {self.api_token.strip()}"
        }
        try:
            with httpx.Client() as client:
                resp = client.get(f"{self.rest_base_url}/accounts", headers=headers, timeout=10.0)
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

    def _get_otp(self, account_id: str) -> Optional[str]:
        headers = {
            "Deriv-App-ID": self.app_id,
            "Authorization": f"Bearer {self.api_token.strip()}"
        }
        try:
            with httpx.Client() as client:
                resp = client.post(f"{self.rest_base_url}/accounts/{account_id}/otp", headers=headers, timeout=10.0)
                if resp.status_code == 201 or resp.status_code == 200:
                    data = resp.json()
                    # The response typically includes the WebSocket URL or the OTP directly.
                    # We will try to extract URL or fallback to building it
                    if "data" in data and "url" in data["data"]:
                        # Extract the OTP query parameter from the URL if needed, or use the URL directly
                        return data["data"]["url"]
                    elif "data" in data and "otp" in data["data"]:
                        # If just the OTP is provided
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

    def _send_receive(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.app_id:
            return {}

        try:
            # 1. Get Account ID
            account_id = self._get_demo_account_id()
            if not account_id:
                print("Could not retrieve demo account ID.")
                return {}

            # 2. Get OTP URL
            ws_url = self._get_otp(account_id)
            if not ws_url:
                print("Could not retrieve WebSocket OTP URL.")
                return {}

            # 3. Connect directly to authenticated URL
            ws = websocket.create_connection(ws_url)

            # Enviar petición principal
            ws.send(json.dumps(request_data))
            response = json.loads(ws.recv())
            ws.close()
            return response
        except Exception as e:
            print(f"Error en websocket de Deriv: {e}")
            return {}

    def _map_instrument(self, instrument: str) -> str:
        # Si es un par de Forex de los configurados, le agregamos el prefijo 'frx'
        if instrument in settings.parsed_pairs:
            parts = instrument.split("_")
            if len(parts) == 2:
                return f"frx{parts[0]}{parts[1]}"

        # Para sintéticos u otros, lo devolvemos tal cual
        return instrument

    def get_active_synthetics(self) -> List[Dict[str, Any]]:
        """Obtiene la lista completa de índices sintéticos de Deriv."""
        req = {
            "active_symbols": "full",
            "product_type": "basic"
        }
        data = self._send_receive(req)
        active_symbols = data.get("active_symbols", [])

        synthetics = []
        for symbol in active_symbols:
            if symbol.get("market") == "synthetic_index":
                synthetics.append(symbol)

        return synthetics

    def get_multi_timeframe_candles(self, instrument: str, timeframes: List[str] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"], count: int = 10) -> Dict[str, Any]:
        results = {}
        deriv_symbol = self._map_instrument(instrument)

        # Mapear temporalidades a granularidad de Deriv (en segundos)
        # 60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400
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
                data = self._send_receive(req)

                formatted_candles = []
                if "candles" in data:
                    for c in data["candles"]:
                        formatted_candles.append({
                            "time": str(c["epoch"]),
                            "open": float(c["open"]),
                            "high": float(c["high"]),
                            "low": float(c["low"]),
                            "close": float(c["close"]),
                            "volume": 0 # Deriv forex ticks may not have reliable volume
                        })
                results[tf] = formatted_candles
            except Exception as e:
                print(f"Error fetching candles for {instrument} ({tf}): {e}")
                results[tf] = []

        return results

    def get_closed_trades(self, count: int = 50) -> List[Dict[str, Any]]:
        # En Deriv obtenemos el statement para las operaciones cerradas
        req = {
            "statement": 1,
            "description": 1,
            "limit": count
        }
        data = self._send_receive(req)

        formatted_trades = []
        if "statement" in data and "transactions" in data["statement"]:
            for tx in data["statement"]["transactions"]:
                # Filtrar solo ventas de contratos para simplificar
                if tx.get("action_type") == "sell":
                    formatted_trades.append({
                        "id": str(tx.get("contract_id")),
                        "instrument": tx.get("shortcode", "").split("_")[1] if tx.get("shortcode") else "UNKNOWN", # Simplificado
                        "realizedPL": float(tx.get("amount", 0)),
                        "clientExtensions": {} # No soportado directamente en Deriv así
                    })
        return formatted_trades

    def get_open_trades_count(self) -> int:
        req = {
            "portfolio": 1
        }
        data = self._send_receive(req)
        if "portfolio" in data and "contracts" in data["portfolio"]:
            return len(data["portfolio"]["contracts"])
        return 0

    def place_market_order(self, instrument: str, units: int, stop_loss_price: float, take_profit_price: float, setup_tag: str = "UNKNOWN_SETUP") -> Dict[str, Any]:
        deriv_symbol = self._map_instrument(instrument)
        # Deriv no usa stop loss en forex de la misma manera exacta en su API genérica de multipliers/CFD,
        # pero la API buy permite parámetros si usamos el tipo de contrato adecuado.
        # Simularemos una orden estándar de Multipliers o de un derivado soportado por la API.

        # En una integración real, se usa MetaTrader 5 API via Deriv para Forex real, pero para
        # mantener el alcance de la API WebSocket usaremos un contrato simplificado.
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
                "duration": 5, # Ejemplo
                "duration_unit": "t"
            }
        }

        try:
            return self._send_receive(req)
        except Exception as e:
            print(f"Error placing order for {instrument}: {e}")
            return {}

# Global instance
deriv = DerivClient()
