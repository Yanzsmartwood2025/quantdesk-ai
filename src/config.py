import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # OANDA
    oanda_api_key: str = ""
    oanda_account_id: str = ""
    oanda_url: str = "https://api-fxpractice.oanda.com"

    # LLM APIs
    groq_api_key: str = ""
    gemini_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # Risk Management Config
    trading_enabled: bool = False
    max_position_size: float = 1000.0
    max_daily_loss: float = 50.0
    max_open_trades: int = 3

    # Pipeline config
    loop_interval_seconds: int = 3600 # default 1 hour
    pairs: str = "EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def parsed_pairs(self) -> List[str]:
        return [p.strip() for p in self.pairs.split(",") if p.strip()]

settings = Settings()
