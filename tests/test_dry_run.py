import unittest
from unittest.mock import patch, MagicMock
import json

import src.main

class TestDryRun(unittest.TestCase):
    @patch('src.main.update_memory_from_closed_trades')
    @patch('src.main.db_client')
    @patch('src.main.deriv')
    @patch('src.agents.base_llm.litellm.completion')
    @patch('src.main.settings')
    def test_dry_run(self, mock_settings, mock_completion, mock_deriv, mock_db_client, mock_update_memory):
        # Configure mocked settings
        mock_settings.trading_enabled = False
        mock_settings.loop_interval_seconds = 1
        mock_settings.parsed_pairs = ["EUR_USD"]
        mock_settings.max_position_size = 1000
        mock_settings.max_open_trades = 3
        mock_settings.max_daily_loss = 50.0

        # Mock Deriv WebSocket responses
        mock_deriv.get_closed_trades.return_value = []
        mock_deriv.get_multi_timeframe_candles.return_value = {
            "D1": [{"close": 1.1000}],
            "H4": [{"close": 1.1020}],
            "H1": [{"close": 1.1050}]
        }
        mock_deriv.get_open_trades_count.return_value = 1

        # Mock Supabase responses
        mock_db_client.get_memory_stats.return_value = {"win_rate": 0.6, "total_trades": 10}

        # Global counter for LLM calls
        llm_call_count = [0]

        def mock_completion_side_effect(*args, **kwargs):
            llm_call_count[0] += 1

            # Create a mock response object
            mock_response = MagicMock()

            # Determine which agent is calling based on the model or prompt
            messages = kwargs.get('messages', [])
            system_prompt = messages[0]['content'] if messages else ""

            if "Portfolio Manager" in system_prompt:
                output = {
                    "action": "BUY",
                    "units": 100,
                    "stop_loss_price": 1.0950,
                    "take_profit_price": 1.1100,
                    "reasoning": "Good technical setup and approved by risk manager."
                }
            elif "Risk Manager" in system_prompt:
                output = {
                    "is_approved": True,
                    "max_position_size": 500,
                    "required_stop_loss_distance": 0.0050,
                    "reasoning": "Within risk limits."
                }
            elif "Technical Analyst" in system_prompt:
                output = {
                    "trend": "BULLISH",
                    "key_support": 1.0950,
                    "key_resistance": 1.1100,
                    "setup_type": "BREAKOUT_BULLISH",
                    "confidence": 0.8,
                    "reasoning": "Strong momentum on H1 aligning with D1."
                }
            else:
                output = {}

            mock_response.choices = [MagicMock(message=MagicMock(content=json.dumps(output)))]
            mock_response.usage = MagicMock(prompt_tokens=100, completion_tokens=50)
            return mock_response

        mock_completion.side_effect = mock_completion_side_effect

        # Import main loop and process one instrument
        from src.main import process_instrument_candles, process_instrument_ai
        from src.agents.analyst import TechAnalystAgent
        from src.agents.risk import RiskManagerAgent
        from src.agents.portfolio import PortfolioManagerAgent
        import uuid

        # Mock DB recent candles since AI pulls from DB now
        mock_db_client.get_latest_candle_time.return_value = 0.0
        mock_db_client.get_recent_candles.return_value = {
            "D1": [{"close": 1.1000}],
            "H4": [{"close": 1.1020}],
            "H1": [{"close": 1.1050}]
        }

        # Initialize agents (with mocked litellm via patch)
        analyst = TechAnalystAgent()
        # Mock API keys so they don't get skipped
        analyst.api_keys = ["mock_key"]

        risk_mgr = RiskManagerAgent()
        risk_mgr.api_keys = ["mock_key"]

        portfolio_mgr = PortfolioManagerAgent()
        portfolio_mgr.api_keys = ["mock_key"]

        cycle_id = str(uuid.uuid4())

        # Execute the process for one instrument
        print("\n--- Starting Dry Run Simulation ---")
        try:
            process_instrument_candles("EUR_USD")
            process_instrument_ai("EUR_USD", cycle_id, analyst, risk_mgr, portfolio_mgr)
            success = True
        except Exception as e:
            print(f"Exception during dry run: {e}")
            success = False

        print(f"\n--- Dry Run Completed ---")
        print(f"Total simulated LLM calls: {llm_call_count[0]}")

        self.assertTrue(success, "process_instrument raised an exception")
        self.assertEqual(llm_call_count[0], 3, "Expected exactly 3 simulated LLM calls")
        self.assertTrue(mock_db_client.save_candles.called, "Candles should have been saved")
        self.assertTrue(mock_db_client.get_memory_stats.called, "Memory stats should have been fetched")

if __name__ == '__main__':
    unittest.main()
