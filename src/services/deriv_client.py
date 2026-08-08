import json
from typing import List, Dict, Any, Optional
import websocket
from src.config import settings

class DerivClient:
    def __init__(self):
        self.app_id = settings.deriv_app_id
        self.api_token = settings.deriv_api_token
        self.base_url = f"wss://ws.derivws.com/websockets/v3?app_id={self.app_id}"

    def _send_receive(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.app_id:
            return {}

        try:
            ws = websocket.create_connection(self.base_url)

            # Autenticación si el token está disponible
            if self.api_token:
                clean_token = self.api_token.strip()
                auth_req = {"authorize": clean_token}
                ws.send(json.dumps(auth_req))
                auth_res = json.loads(ws.recv())
                if "error" in auth_res:
                    print(f"Error en autenticación Deriv: {auth_res['error']}")
                    ws.close()
                    return {}

            # Enviar petición principal
            ws.send(json.dumps(request_data))
            response = json.loads(ws.recv())
            ws.close()
            return response
        except Exception as e:
            print(f"Error en websocket de Deriv: {e}")
            return {}

    def _map_instrument(self, instrument: str) -> str:
        # Mapear EUR_USD a frxEURUSD
        parts = instrument.split("_")
        if len(parts) == 2:
            return f"frx{parts[0]}{parts[1]}"
        return instrument

    def get_multi_timeframe_candles(self, instrument: str, timeframes: List[str] = ["D1", "H4", "H1"], count: int = 10) -> Dict[str, Any]:
        results = {}
        deriv_symbol = self._map_instrument(instrument)

        # Mapear temporalidades a granularidad de Deriv (en segundos)
        # 60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400
        tf_map = {
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
