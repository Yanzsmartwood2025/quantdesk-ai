import asyncio
import time
import uuid
from typing import List, Dict, Any

from src.config import settings
from src.services.deriv_client import deriv
from src.services.supabase_client import db_client
from src.agents.analyst import TechAnalystAgent
from src.agents.risk import RiskManagerAgent
from src.agents.portfolio import PortfolioManagerAgent
from src.utils.task_logger import log_task_exception

async def update_memory_from_closed_trades():
    """Polls recently closed trades and updates Supabase memory."""
    print("[SYSTEM] Checking for recently closed trades...")
    closed_trades = await deriv.get_closed_trades(count=50)
    for trade in closed_trades:
        # We need to extract the instrument, outcome (win/loss), PnL, and trade_id
        trade_id = trade.get("id")
        instrument = trade.get("instrument")
        realized_pl = float(trade.get("realizedPL", 0.0))

        if not trade_id or not instrument:
            continue

        outcome = "WIN" if realized_pl > 0 else "LOSS"

        client_ext = trade.get("clientExtensions", {})
        setup_type = client_ext.get("tag", "UNKNOWN_SETUP")

        try:
            await asyncio.wait_for(
                asyncio.to_thread(
                    db_client.save_trade_outcome,
                    instrument,
                    setup_type,
                    outcome,
                    realized_pl,
                    trade_id
                ),
                timeout=10.0
            )
        except asyncio.TimeoutError:
            print(f"[SYSTEM ERROR] Timeout saving trade outcome for {trade_id}")
        except Exception as e:
            print(f"[SYSTEM ERROR] Failed to save trade outcome for {trade_id}: {e}")

async def upsert_candles_loop():
    """Background loop that saves forming/closed candles to DB every 5 seconds."""
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [UPSERT LOOP] Started")
    cycle_count = 0
    while True:
        cycle_count += 1
        closed_candles = []
        try:
            # Diagnostic log at the start of each iteration
            forming_count = sum(len(tfs) for tfs in deriv.current_candles.values())
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [UPSERT LOOP] Cycle {cycle_count}, closed candles to flush: {len(deriv.candles_to_flush)}, forming candles in memory: {forming_count}")
            # 1. First process any closed candles that were queued up
            closed_candles = deriv.candles_to_flush.copy()
            deriv.candles_to_flush.clear()

            # Group by instrument to leverage bulk upserts
            flush_dict: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
            for item in closed_candles:
                inst = item["instrument"]
                tf = item["timeframe"]
                c_data = item["data"]

                if inst not in flush_dict:
                    flush_dict[inst] = {}
                if tf not in flush_dict[inst]:
                    flush_dict[inst][tf] = []

                flush_dict[inst][tf].append({
                    "time": c_data["time"],
                    "open": c_data["open"],
                    "high": c_data["high"],
                    "low": c_data["low"],
                    "close": c_data["close"],
                    "volume": 0,
                    "is_closed": True
                })

            # Upsert closed candles using thread pool with wait_for to prevent silent hangs
            for instrument, db_candles_dict in flush_dict.items():
                await asyncio.wait_for(
                    asyncio.to_thread(db_client.save_candles, instrument, db_candles_dict),
                    timeout=10.0
                )

            # 2. Then process the current forming candles
            if deriv.current_candles:
                for instrument, tfs in list(deriv.current_candles.items()):
                    db_candles_dict = {}
                    for tf, candle_data in list(tfs.items()):
                        db_candles_dict[tf] = [{
                            "time": candle_data["time"],
                            "open": candle_data["open"],
                            "high": candle_data["high"],
                            "low": candle_data["low"],
                            "close": candle_data["close"],
                            "volume": 0,
                            "is_closed": candle_data.get("is_closed", False)
                        }]

                    if db_candles_dict:
                        await asyncio.wait_for(
                            asyncio.to_thread(db_client.save_candles, instrument, db_candles_dict),
                            timeout=10.0
                        )
        except asyncio.TimeoutError:
            print("[CANDLE SYNC ERROR] Timeout saving candles to DB. Thread pool may be constrained.")
            if closed_candles:
                deriv.candles_to_flush.extend(closed_candles)
        except Exception as e:
            print(f"[CANDLE SYNC ERROR] {repr(e)}")
            # Put closed candles back into the queue so they aren't lost
            if closed_candles:
                deriv.candles_to_flush.extend(closed_candles)

        await asyncio.sleep(5)

async def process_instrument_ai(instrument: str, cycle_id: str, analyst: TechAnalystAgent, risk_mgr: RiskManagerAgent, portfolio_mgr: PortfolioManagerAgent):
    """Runs the AI pipeline using candles fetched from the database."""
    print(f"\n[AI PIPELINE] Processing {instrument}...")

    # 1. Fetch Multi-Timeframe Data from DB
    try:
        candles = await asyncio.wait_for(
            asyncio.to_thread(
                db_client.get_recent_candles,
                instrument,
                ["M1", "M5", "M15", "M30", "H1", "H4", "D1"],
                20
            ),
            timeout=10.0
        )
    except asyncio.TimeoutError:
        print(f"[{instrument}] Timeout fetching candle data from DB. Skipping.")
        return
    except Exception as e:
        print(f"[{instrument}] Error fetching candle data: {e}. Skipping.")
        return

    if not any(candles.values()):
        print(f"[{instrument}] No candle data in DB. Skipping.")
        return

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
    open_trades_count = await deriv.get_open_trades_count()
    print(f"[{instrument}] Running Risk Manager (Open trades: {open_trades_count})...")
    risk_result = risk_mgr.evaluate(instrument, analyst_result.model_dump(), open_trades_count, cycle_id)
    if not risk_result:
        print(f"[{instrument}] Risk Manager failed. Skipping.")
        return

    # 4. Fetch Memory
    print(f"[{instrument}] Fetching memory for setup: {setup_type}...")
    try:
        memory_stats = await asyncio.wait_for(
            asyncio.to_thread(db_client.get_memory_stats, instrument, setup_type),
            timeout=10.0
        )
    except asyncio.TimeoutError:
        print(f"[{instrument}] Timeout fetching memory stats. Proceeding with empty memory.")
        memory_stats = {"total": 0, "wins": 0, "losses": 0, "win_rate": 0.0}
    except Exception as e:
        print(f"[{instrument}] Error fetching memory stats: {e}. Proceeding with empty memory.")
        memory_stats = {"total": 0, "wins": 0, "losses": 0, "win_rate": 0.0}

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

            order_resp = await deriv.place_market_order(
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


async def main_loop():
    print("="*50)
    print("QuantDesk AI Pipeline Started")
    print(f"Trading Enabled: {settings.trading_enabled}")
    print(f"AI Loop Interval: {settings.loop_interval_seconds} seconds")
    print(f"Pairs: {settings.parsed_pairs}")

    # Start Deriv WebSocket Connection with retry
    while not deriv._connected.is_set():
        await deriv.connect()
        if not deriv._connected.is_set():
            print("[SYSTEM] Initial Deriv connection failed. Retrying in 5 seconds...")
            await asyncio.sleep(5)

    # Sync synthetics on startup
    print("Syncing synthetic indices from Deriv...")
    synthetics = await deriv.get_active_synthetics()
    if synthetics:
        try:
            await asyncio.wait_for(
                asyncio.to_thread(db_client.sync_synthetics, synthetics),
                timeout=15.0
            )
        except asyncio.TimeoutError:
            print("[SYSTEM ERROR] Timeout syncing synthetic indices to DB on startup.")
        except Exception as e:
            print(f"[SYSTEM ERROR] Error syncing synthetic indices: {e}")
    else:
        print("Warning: Could not fetch active synthetics from Deriv.")
    print("="*50)

    # Start the continuous candle upsert background loop
    upsert_task = asyncio.create_task(upsert_candles_loop(), name="upsert_candles_loop")
    upsert_task.add_done_callback(log_task_exception)

    analyst = TechAnalystAgent()
    risk_mgr = RiskManagerAgent()
    portfolio_mgr = PortfolioManagerAgent()

    last_ai_run_time = {}
    AI_CHECK_INTERVAL = 60 # Check if AI needs to run every 60s

    while True:
        cycle_id = str(uuid.uuid4())
        print(f"\n--- Starting new cycle: {cycle_id} ---")
        current_time = time.time()

        try:
            # Sync memory first
            await update_memory_from_closed_trades()

            # Fetch active statuses for all instruments
            try:
                active_statuses = await asyncio.wait_for(
                    asyncio.to_thread(db_client.get_active_instruments_statuses),
                    timeout=10.0
                )
            except asyncio.TimeoutError:
                print("[SYSTEM ERROR] Timeout fetching active instruments statuses.")
                active_statuses = {}
            except Exception as e:
                print(f"[SYSTEM ERROR] Failed to fetch active instruments statuses: {e}")
                active_statuses = {}

            # All instruments that exist in active_statuses + parsed_pairs
            all_instruments = set(settings.parsed_pairs) | set(active_statuses.keys())

            # Ensure we are subscribed to all active instruments for tick streaming
            for instrument in all_instruments:
                if active_statuses.get(instrument, False) or instrument in settings.parsed_pairs:
                    await deriv.subscribe_ticks(instrument)

            # 2. Run AI Pipeline only for ACTIVE instruments if interval has passed
            for instrument in all_instruments:
                is_active = active_statuses.get(instrument, False)
                if not is_active:
                    continue

                last_run = last_ai_run_time.get(instrument, 0)
                if (current_time - last_run) >= settings.loop_interval_seconds:
                    await process_instrument_ai(instrument, cycle_id, analyst, risk_mgr, portfolio_mgr)
                    last_ai_run_time[instrument] = current_time
                else:
                    print(f"\n[{instrument}] Skipping AI (last run {current_time - last_run:.0f}s ago).")

        except Exception as e:
            print(f"[SYSTEM ERROR] {e}")

        print(f"\n--- Cycle complete. Sleeping for {AI_CHECK_INTERVAL}s ---")
        await asyncio.sleep(AI_CHECK_INTERVAL)

if __name__ == "__main__":
    asyncio.run(main_loop())
