file_path = "src/config.py"
with open(file_path, "r") as f:
    content = f.read()

search = """    # Pipeline config
    loop_interval_seconds: int = 3600 # default 1 hour
    pairs: str = "EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def parsed_pairs(self) -> List[str]:
        return [p.strip() for p in self.pairs.split(",") if p.strip()]"""

replace = """    # Pipeline config
    loop_interval_seconds: int = 3600 # default 1 hour
    pairs: str = "EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD"
    synthetic_instruments: str = "R_75,R_100,BOOM1000,CRASH1000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def parsed_pairs(self) -> List[str]:
        return [p.strip() for p in self.pairs.split(",") if p.strip()]

    @property
    def parsed_synthetic_instruments(self) -> List[str]:
        return [p.strip() for p in self.synthetic_instruments.split(",") if p.strip()]"""

content = content.replace(search, replace)

with open(file_path, "w") as f:
    f.write(content)
