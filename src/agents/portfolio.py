from typing import Optional
from pydantic import BaseModel, Field
from src.agents.base_llm import BaseAgent
import json

class PortfolioManagerOutput(BaseModel):
    action: str = Field(description="The final decision: BUY, SELL, or HOLD")
    units: int = Field(description="The number of units to trade. Must be 0 if action is HOLD. Positive for BUY, negative for SELL.")
    stop_loss_price: float = Field(description="The exact price for the Stop Loss. Mandatory if action is not HOLD.")
    take_profit_price: float = Field(description="The exact price for the Take Profit. Mandatory if action is not HOLD.")
    reasoning: str = Field(description="Brief explanation combining tech analysis, risk approval, and past performance memory.")

class PortfolioManagerAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are the Portfolio Manager (Final Decision Maker) for a forex trading desk. "
            "You receive inputs from the Tech Analyst, the Risk Manager, and the historical performance memory for this setup. "
            "Your job is to make the final call: BUY, SELL, or HOLD.\n"
            "Rules:\n"
            "1. If the Risk Manager denies the trade, you MUST output HOLD.\n"
            "2. If the historical memory shows this setup fails frequently (win rate < 40%), you should be highly skeptical and likely HOLD, regardless of analyst confidence.\n"
            "3. If you decide to BUY or SELL, you MUST provide precise units (respecting Risk Manager's max size), stop_loss_price, and take_profit_price based on the key levels provided by the Tech Analyst.\n"
            "4. For BUY: Stop loss should be below entry/support, take profit near resistance.\n"
            "5. For SELL: Stop loss should be above entry/resistance, take profit near support.\n"
            "6. Units should be positive for BUY, negative for SELL."
        )
        super().__init__(role_name="portfolio_manager", system_prompt=system_prompt, response_model=PortfolioManagerOutput)

    def decide(
        self,
        instrument: str,
        analyst_output: dict,
        risk_output: dict,
        memory_stats: dict,
        current_price: float,
        cycle_id: str
    ) -> Optional[PortfolioManagerOutput]:

        input_data = (
            f"Instrument: {instrument} (Current Price roughly {current_price})\n"
            f"Tech Analyst Report: {json.dumps(analyst_output, indent=2)}\n"
            f"Risk Manager Report: {json.dumps(risk_output, indent=2)}\n"
            f"Historical Memory for setup '{analyst_output.get('setup_type', 'unknown')}': {json.dumps(memory_stats, indent=2)}\n\n"
            f"Make the final decision."
        )

        return self.run(input_data=input_data, instrument=instrument, cycle_id=cycle_id)
