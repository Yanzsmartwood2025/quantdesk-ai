import json
from typing import Optional
from pydantic import BaseModel, Field
from src.agents.base_llm import BaseAgent

class TechAnalystOutput(BaseModel):
    trend: str = Field(description="The overall trend: BULLISH, BEARISH, or RANGING")
    key_support: float = Field(description="The nearest key support price level")
    key_resistance: float = Field(description="The nearest key resistance price level")
    setup_type: str = Field(description="A short string identifying the technical setup, e.g., 'BREAKOUT_BULLISH', 'MEAN_REVERSION', 'NONE'")
    confidence: float = Field(description="Confidence score from 0.0 to 1.0 based on confluence across timeframes")
    reasoning: str = Field(description="Brief explanation of the analysis")

class TechAnalystAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are an expert Technical Analyst for a forex trading desk. "
            "Your job is to analyze multi-timeframe price data (candles) and identify trends, key levels, and actionable setups. "
            "You must output a strictly formatted JSON conforming to the requested schema. "
            "IMPORTANT: ALL fields in the schema are mandatory and MUST be present in your JSON output. "
            "You must not omit any fields. Even if you are unsure, provide your best estimate or a default value for that type. "
            "Example valid output:\n"
            "{\n"
            '  "trend": "BULLISH",\n'
            '  "key_support": 1.1050,\n'
            '  "key_resistance": 1.1120,\n'
            '  "setup_type": "BREAKOUT_BULLISH",\n'
            '  "confidence": 0.85,\n'
            '  "reasoning": "Strong bullish momentum across D1 and H4, breaking resistance on H1."\n'
            "}\n"
            "Focus on confluence across the provided timeframes (e.g. Daily trend aligning with 1H entry setup)."
        )
        from src.config import settings
        super().__init__(
            role_name="analyst",
            system_prompt=system_prompt,
            response_model=TechAnalystOutput,
            model_name=settings.groq_model,
            api_keys=[settings.groq_api_key_1, settings.groq_api_key_2]
        )

    def analyze(self, instrument: str, multi_tf_candles: dict, cycle_id: str) -> Optional[TechAnalystOutput]:
        input_data = f"Instrument: {instrument}\nCandles Data:\n{json.dumps(multi_tf_candles, indent=2)}\n\nPlease provide your technical analysis."
        return self.run(input_data=input_data, instrument=instrument, cycle_id=cycle_id)
