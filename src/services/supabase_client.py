from typing import Dict, Any, Optional
from datetime import datetime, timezone
from supabase import create_client, Client
from src.config import settings

class SupabaseService:
    def __init__(self):
        # Allow running without actual keys for local testing, though the client will fail on requests
        url = settings.supabase_url or "https://placeholder.supabase.co"
        key = settings.supabase_key or "placeholder_key"
        self.client: Client = create_client(url, key)
        self.is_configured = bool(settings.supabase_url and settings.supabase_key)

    def log_agent_trace(
        self,
        instrument: str,
        cycle_id: str,
        agent_role: str,
        inputs: Dict[str, Any],
        outputs: Dict[str, Any],
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        provider: Optional[str] = None
    ) -> None:
        """Logs an agent's reasoning and inputs/outputs to the database."""
        if not self.is_configured:
            print(f"Supabase not configured. Skipping log for {agent_role}.")
            return

        data = {
            "instrument": instrument,
            "cycle_id": str(cycle_id),
            "agent_role": agent_role,
            "inputs": inputs,
            "outputs": outputs,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "provider": provider
        }

        try:
            self.client.table("agent_traces").insert(data).execute()
        except Exception as e:
            print(f"Error logging trace to Supabase: {e}")

    def save_trade_outcome(
        self,
        instrument: str,
        setup_type: str,
        outcome: str,
        pnl: float,
        trade_id: str
    ) -> None:
        """Saves a trade outcome to memory if it doesn't already exist."""
        if not self.is_configured:
            return

        data = {
            "instrument": instrument,
            "setup_type": setup_type,
            "outcome": outcome,
            "pnl": pnl,
            "trade_id": trade_id
        }
        try:
            # We use insert. The DB unique constraint on trade_id handles duplicates,
            # but we can also check beforehand or handle the constraint error.
            self.client.table("trading_memory").insert(data).execute()
        except Exception as e:
            # Ignore duplicate key errors if trade was already logged
            if "duplicate key value" not in str(e):
                print(f"Error saving trade outcome to Supabase: {e}")

    def save_candles(self, instrument: str, candles_dict: Dict[str, Any]) -> None:
        """Saves multi-timeframe candles to the database."""
        if not self.is_configured:
            return

        records = []
        for timeframe, candles in candles_dict.items():
            if not candles:
                continue
            for candle in candles:
                try:
                    # Convert epoch string to datetime object, then to ISO-8601 string for Supabase
                    epoch_str = candle.get("time")
                    if not epoch_str:
                        continue

                    epoch_float = float(epoch_str)
                    dt = datetime.fromtimestamp(epoch_float, tz=timezone.utc)
                    iso_timestamp = dt.isoformat()

                    records.append({
                        "instrument": instrument,
                        "timeframe": timeframe,
                        "timestamp": iso_timestamp,
                        "open": candle.get("open"),
                        "high": candle.get("high"),
                        "low": candle.get("low"),
                        "close": candle.get("close"),
                        "volume": candle.get("volume", 0)
                    })
                except Exception as e:
                    print(f"Error preparing candle for DB insertion: {e}")

        if not records:
            return

        try:
            # We use upsert with on_conflict to avoid duplicates
            self.client.table("market_candles").upsert(
                records,
                on_conflict="instrument,timeframe,timestamp"
            ).execute()
        except Exception as e:
            print(f"Error saving candles to Supabase: {e}")

    def get_memory_stats(self, instrument: str, setup_type: Optional[str] = None) -> Dict[str, Any]:
        """Fetches win/loss statistics for a given instrument and optionally a specific setup."""
        if not self.is_configured:
            return {"total": 0, "wins": 0, "losses": 0, "win_rate": 0.0}

        try:
            query = self.client.table("trading_memory").select("outcome").eq("instrument", instrument)
            if setup_type:
                query = query.eq("setup_type", setup_type)

            response = query.execute()
            data = response.data

            wins = sum(1 for row in data if row["outcome"] == "WIN")
            losses = sum(1 for row in data if row["outcome"] == "LOSS")
            total = wins + losses

            return {
                "total": total,
                "wins": wins,
                "losses": losses,
                "win_rate": (wins / total) if total > 0 else 0.0
            }
        except Exception as e:
            print(f"Error fetching memory stats: {e}")
            return {"total": 0, "wins": 0, "losses": 0, "win_rate": 0.0}

    def get_active_instruments_statuses(self) -> Dict[str, bool]:
        """Fetches the active status of all instruments."""
        if not self.is_configured:
            return {}

        try:
            response = self.client.table("active_instruments").select("instrument, is_active").execute()
            data = response.data
            return {row["instrument"]: row["is_active"] for row in data}
        except Exception as e:
            print(f"Error fetching active instruments statuses: {e}")
            return {}

# Global instance
db_client = SupabaseService()
