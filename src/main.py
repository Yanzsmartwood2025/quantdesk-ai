import time
import uuid
from typing import List, Dict, Any

from src.config import settings
from src.services.deriv_client import deriv
from src.services.supabase_client import db_client
from src.agents.analyst import TechAnalystAgent
from src.agents.risk import RiskManagerAgent
from src.agents.portfolio import PortfolioManagerAgent

def update_memory_from_closed_trades():
    """Polls recently closed trades and updates Supabase memory."""
    print("[SYSTEM] Checking for recently closed trades...")
    closed_trades = deriv.get_closed_trades(count=50)
    for trade in closed_trades:
        # We need to extract the instrument, outcome (win/loss), PnL, and trade_id
        trade_id = trade.get("id")
        instrument = trade.get("instrument")
        realized_pl = float(trade.get("realizedPL", 0.0))

        if not trade_id or not instrument:
            continue

        outcome = "WIN" if realized_pl > 0 else "LOSS"

        # Deriv doesn't inherently store our "setup_type" in a simple way for CFD/Multipliers.
        # In a full production system, we'd map trade_id back to our agent traces.
        # For now, we will store a generic setup if we don't have it.
        # We'll log it as "UNKNOWN_SETUP" since we don't have clientExtensions support right now.
        client_ext = trade.get("clientExtensions", {})
        setup_type = client_ext.get("tag", "UNKNOWN_SETUP")

        db_client.save_trade_outcome(
            instrument=instrument,
            setup_type=setup_type,
            outcome=outcome,
            pnl=realized_pl,
            trade_id=trade_id
        )

def process_instrument(instrument: str, cycle_id: str, analyst: TechAnalystAgent, risk_mgr: RiskManagerAgent, portfolio_mgr: PortfolioManagerAgent):
    print(f"\n[PIPELINE] Processing {instrument}...")

    # 1. Fetch Multi-Timeframe Data
    candles = deriv.get_multi_timeframe_candles(instrument, timeframes=["D1", "H4", "H1"], count=20)
    if not any(candles.values()):
        print(f"[{instrument}] No candle data fetched. Skipping.")
        return

    # Save the fetched candles to DB
    print(f"[{instrument}] Saving recent candles to database...")
    db_client.save_candles(instrument, candles)

    # Extract current price for the portfolio manager
    current_price = 0.0
    if candles.get("H1") and len(candles["H1"]) > 0:
        current_price = candles["H1"][-1]["close"]
    elif candles.get("D1") and len(candles["D1"]) > 0:
         current_price = candles["D1"][-1]["close"]

    if current_price == 0.0:
        print(f"[{instrument}] Could not determine current price. Skipping.")
        return

    # 2. Tech Analyst
    print(f"[{instrument}] Running Tech Analyst...")
    analyst_result = analyst.analyze(instrument, candles, cycle_id)
    if not analyst_result:
        print(f"[{instrument}] Tech Analyst failed. Skipping.")
        return

    setup_type = analyst_result.setup_type

    # 3. Risk Manager
    open_trades_count = deriv.get_open_trades_count()
    print(f"[{instrument}] Running Risk Manager (Open trades: {open_trades_count})...")
    risk_result = risk_mgr.evaluate(instrument, analyst_result.model_dump(), open_trades_count, cycle_id)
    if not risk_result:
        print(f"[{instrument}] Risk Manager failed. Skipping.")
        return

    # 4. Fetch Memory
    print(f"[{instrument}] Fetching memory for setup: {setup_type}...")
    memory_stats = db_client.get_memory_stats(instrument, setup_type)

    # 5. Portfolio Manager
    print(f"[{instrument}] Running Portfolio Manager...")
    pm_result = portfolio_mgr.decide(
        instrument=instrument,
        analyst_output=analyst_result.model_dump(),
        risk_output=risk_result.model_dump(),
        memory_stats=memory_stats,
        current_price=current_price,
        cycle_id=cycle_id
    )

    if not pm_result:
        print(f"[{instrument}] Portfolio Manager failed. Skipping.")
        return

    # 6. Execution
    print(f"[{instrument}] Decision: {pm_result.action}")
    if pm_result.action in ["BUY", "SELL"] and pm_result.units != 0:
        if settings.trading_enabled:
            print(f"[{instrument}] Executing {pm_result.action} of {pm_result.units} units. SL: {pm_result.stop_loss_price}, TP: {pm_result.take_profit_price}")

            order_resp = deriv.place_market_order(
                instrument=instrument,
                units=pm_result.units,
                stop_loss_price=pm_result.stop_loss_price,
                take_profit_price=pm_result.take_profit_price,
                setup_tag=setup_type
            )
            print(f"[{instrument}] Order response: {order_resp}")
        else:
            print(f"[{instrument}] TRADING_ENABLED is false. Simulating execution only.")
    else:
        print(f"[{instrument}] Holding. No execution needed.")


def main_loop():
    print("="*50)
    print("QuantDesk AI Pipeline Started")
    print(f"Trading Enabled: {settings.trading_enabled}")
    print(f"Loop Interval: {settings.loop_interval_seconds} seconds")
    print(f"Pairs: {settings.parsed_pairs}")
    print(f"Synthetics: {settings.parsed_synthetic_instruments}")
    print("="*50)

    analyst = TechAnalystAgent()
    risk_mgr = RiskManagerAgent()
    portfolio_mgr = PortfolioManagerAgent()

    while True:
        cycle_id = str(uuid.uuid4())
        print(f"\n--- Starting new cycle: {cycle_id} ---")

        try:
            # Sync memory first
            update_memory_from_closed_trades()

            # Process each pair
            for pair in settings.parsed_pairs:
                process_instrument(pair, cycle_id, analyst, risk_mgr, portfolio_mgr)

            # Process each synthetic instrument
            for synth in settings.parsed_synthetic_instruments:
                process_instrument(synth, cycle_id, analyst, risk_mgr, portfolio_mgr)

        except Exception as e:
            print(f"[SYSTEM ERROR] {e}")

        print(f"\n--- Cycle complete. Sleeping for {settings.loop_interval_seconds}s ---")
        time.sleep(settings.loop_interval_seconds)

if __name__ == "__main__":
    main_loop()
