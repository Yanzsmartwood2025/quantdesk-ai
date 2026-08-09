file_path = ".env.example"
with open(file_path, "r") as f:
    content = f.read()

search = """# Application Settings
LOOP_INTERVAL_SECONDS=3600
PAIRS=EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD"""

replace = """# Application Settings
LOOP_INTERVAL_SECONDS=3600
PAIRS=EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD
SYNTHETIC_INSTRUMENTS=R_75,R_100,BOOM1000,CRASH1000"""

content = content.replace(search, replace)

with open(file_path, "w") as f:
    f.write(content)
