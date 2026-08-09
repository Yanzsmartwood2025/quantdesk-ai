import re

file_path = "src/services/deriv_client.py"
with open(file_path, "r") as f:
    content = f.read()

search = """    def _map_instrument(self, instrument: str) -> str:
        # Mapear EUR_USD a frxEURUSD
        parts = instrument.split("_")
        if len(parts) == 2:
            return f"frx{parts[0]}{parts[1]}"
        return instrument"""

replace = """    def _map_instrument(self, instrument: str) -> str:
        # Sintéticos de Deriv no llevan prefijo "frx"
        if instrument in ["R_75", "R_100", "BOOM1000", "CRASH1000"]:
            return instrument

        # Mapear EUR_USD a frxEURUSD
        parts = instrument.split("_")
        if len(parts) == 2:
            return f"frx{parts[0]}{parts[1]}"
        return instrument"""

content = content.replace(search, replace)

with open(file_path, "w") as f:
    f.write(content)
