file_path = "src/main.py"
with open(file_path, "r") as f:
    content = f.read()

search = """def main_loop():
    print("="*50)
    print("QuantDesk AI Pipeline Started")
    print(f"Trading Enabled: {settings.trading_enabled}")
    print(f"Loop Interval: {settings.loop_interval_seconds} seconds")
    print(f"Pairs: {settings.parsed_pairs}")
    print("="*50)"""

replace = """def main_loop():
    print("="*50)
    print("QuantDesk AI Pipeline Started")
    print(f"Trading Enabled: {settings.trading_enabled}")
    print(f"Loop Interval: {settings.loop_interval_seconds} seconds")
    print(f"Pairs: {settings.parsed_pairs}")
    print(f"Synthetics: {settings.parsed_synthetic_instruments}")
    print("="*50)"""

content = content.replace(search, replace)

search2 = """        try:
            # Sync memory first
            update_memory_from_closed_trades()

            # Process each pair
            for pair in settings.parsed_pairs:
                process_instrument(pair, cycle_id, analyst, risk_mgr, portfolio_mgr)

        except Exception as e:"""

replace2 = """        try:
            # Sync memory first
            update_memory_from_closed_trades()

            # Process each pair
            for pair in settings.parsed_pairs:
                process_instrument(pair, cycle_id, analyst, risk_mgr, portfolio_mgr)

            # Process each synthetic instrument
            for synth in settings.parsed_synthetic_instruments:
                process_instrument(synth, cycle_id, analyst, risk_mgr, portfolio_mgr)

        except Exception as e:"""

content = content.replace(search2, replace2)

with open(file_path, "w") as f:
    f.write(content)
