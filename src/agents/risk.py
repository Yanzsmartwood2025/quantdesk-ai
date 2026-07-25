from typing import Optional
from pydantic import BaseModel, Field
from src.agents.base_llm import BaseAgent
from src.config import settings
import json

class RiskManagerOutput(BaseModel):
    is_approved: bool = Field(description="Whether the setup is approved from a risk perspective")
    max_position_size: float = Field(description="The maximum allowed position size (units)")
    required_stop_loss_distance: float = Field(description="The minimum required distance (in price units) for the stop loss to respect daily loss limits")
    reasoning: str = Field(description="Brief explanation of the risk decision")

class RiskManagerAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are the Risk Manager for a forex trading desk. "
            "Your ONLY goal is to protect capital. You do NOT care about maximizing profit. "
            "You will receive a technical setup, the current open trades count, and risk parameters. "
            "You must ensure that:\n"
            "1. We do not exceed max open trades.\n"
            "2. The position size does not exceed the absolute max position size.\n"
            "3. We have a clear understanding of the stop loss required to not exceed daily loss limits.\n"
            "If any rule is breached or the setup is too weak, you must deny the trade (is_approved=false)."
        )
        super().__init__(role_name="risk_manager", system_prompt=system_prompt, response_model=RiskManagerOutput)

    def evaluate(
        self,
        instrument: str,
        analyst_output: dict,
        open_trades_count: int,
        cycle_id: str
    ) -> Optional[RiskManagerOutput]:

        input_data = (
            f"Instrument: {instrument}\n"
            f"Technical Analysis: {json.dumps(analyst_output, indent=2)}\n"
            f"Current Open Trades: {open_trades_count}\n"
            f"Risk Config: Max Position={settings.max_position_size}, Max Open Trades={settings.max_open_trades}, Max Daily Loss={settings.max_daily_loss}\n\n"
            f"Evaluate the risk and provide your decision."
        )

        return self.run(input_data=input_data, instrument=instrument, cycle_id=cycle_id)
