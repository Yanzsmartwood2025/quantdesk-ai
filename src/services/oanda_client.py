import httpx
from typing import List, Dict, Any, Optional
from src.config import settings

class OandaClient:
    def __init__(self):
        self.api_key = settings.oanda_api_key
        self.account_id = settings.oanda_account_id
        self.base_url = settings.oanda_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.api_key or not self.account_id:
            return {} # Return empty in test/unconfigured mode

        url = f"{self.base_url}/v3/{endpoint}"
        with httpx.Client() as client:
            response = client.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()

    def _post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key or not self.account_id:
            return {}

        url = f"{self.base_url}/v3/{endpoint}"
        with httpx.Client() as client:
            response = client.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()

    def get_multi_timeframe_candles(self, instrument: str, timeframes: List[str] = ["D1", "H4", "H1"], count: int = 10) -> Dict[str, Any]:
        """
        Fetches candles for multiple timeframes in one go.
        Returns a dictionary mapping timeframe to its candle data.
        """
        results = {}
        for tf in timeframes:
            try:
                # OANDA expects instruments in format EUR_USD
                params = {"count": count, "granularity": tf}
                data = self._get(f"instruments/{instrument}/candles", params=params)

                # Format to a simpler structure for the LLM
                formatted_candles = []
                if "candles" in data:
                    for c in data["candles"]:
                        if c["complete"]:
                            formatted_candles.append({
                                "time": c["time"],
                                "open": float(c["mid"]["o"]),
                                "high": float(c["mid"]["h"]),
                                "low": float(c["mid"]["l"]),
                                "close": float(c["mid"]["c"]),
                                "volume": c["volume"]
                            })
                results[tf] = formatted_candles
            except Exception as e:
                print(f"Error fetching candles for {instrument} ({tf}): {e}")
                results[tf] = []

        return results

    def get_closed_trades(self, count: int = 50) -> List[Dict[str, Any]]:
        """
        Gets recently closed trades to update the performance memory.
        """
        try:
            params = {"state": "CLOSED", "count": count}
            data = self._get(f"accounts/{self.account_id}/trades", params=params)
            return data.get("trades", [])
        except Exception as e:
            print(f"Error fetching closed trades: {e}")
            return []

    def get_open_trades_count(self) -> int:
        """
        Returns the number of currently open trades across all instruments.
        """
        try:
            data = self._get(f"accounts/{self.account_id}/trades", params={"state": "OPEN"})
            return len(data.get("trades", []))
        except Exception as e:
            print(f"Error fetching open trades: {e}")
            return 0

    def place_market_order(self, instrument: str, units: int, stop_loss_price: float, take_profit_price: float, setup_tag: str = "UNKNOWN_SETUP") -> Dict[str, Any]:
        """
        Places a market order with Stop Loss and Take Profit.
        Units: positive for BUY, negative for SELL.
        """
        data = {
            "order": {
                "units": str(units),
                "instrument": instrument,
                "timeInForce": "FOK", # Fill Or Kill for market orders
                "type": "MARKET",
                "positionFill": "DEFAULT",
                "stopLossOnFill": {
                    "price": str(stop_loss_price)
                },
                "takeProfitOnFill": {
                    "price": str(take_profit_price)
                },
                "clientExtensions": {
                    "tag": setup_tag
                }
            }
        }

        try:
            return self._post(f"accounts/{self.account_id}/orders", data=data)
        except Exception as e:
            print(f"Error placing order for {instrument}: {e}")
            return {}

# Global instance
oanda = OandaClient()
