import json
from typing import Type, Any, Dict, Optional, Tuple
from pydantic import BaseModel
import litellm
from src.config import settings
from src.services.supabase_client import db_client

# Suppress litellm logging if needed
litellm.set_verbose = False

class BaseAgent:
    def __init__(self, role_name: str, system_prompt: str, response_model: Type[BaseModel]):
        self.role_name = role_name
        self.system_prompt = system_prompt
        self.response_model = response_model

        # We will attempt Groq first, then fallback to Gemini
        self.primary_model = "groq/llama3-70b-8192" # or mixtral-8x7b-32768
        self.fallback_model = "gemini/gemini-1.5-flash"

        # Register API keys
        import os
        os.environ["GROQ_API_KEY"] = settings.groq_api_key
        os.environ["GEMINI_API_KEY"] = settings.gemini_api_key

    def _format_prompt(self, user_content: str) -> list:
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_content}
        ]

    def _extract_json_from_response(self, text: str) -> Dict[str, Any]:
        """Attempt to extract a JSON block if the model wraps it in markdown"""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())

    def run(self, input_data: str, instrument: str, cycle_id: str) -> Optional[BaseModel]:
        """
        Runs the LLM call with litellm routing (primary -> fallback).
        Parses output into Pydantic model and logs trace to Supabase.
        """
        # If API keys aren't set, return mock or None to allow tests to run without billing
        if not settings.groq_api_key and not settings.gemini_api_key:
            print(f"[{self.role_name}] Skipping LLM call, API keys not configured.")
            return None

        messages = self._format_prompt(input_data)

        # Configure fallbacks
        fallbacks = [self.fallback_model]

        # Pydantic schema for structured output
        schema = self.response_model.model_json_schema()

        response = None
        provider_used = self.primary_model
        try:
            # We use litellm.completion with response_format to enforce JSON
            # and fallbacks parameter to automatically switch if Groq fails
            response = litellm.completion(
                model=self.primary_model,
                messages=messages,
                fallbacks=fallbacks,
                response_format={"type": "json_object", "schema": schema},
                temperature=0.0 # Lowest temp for deterministic reasoning
            )

            # litellm populates response.model based on which model actually succeeded
            provider_used = response.model

            content = response.choices[0].message.content
            parsed_json = self._extract_json_from_response(content)

            # Validate with Pydantic
            result = self.response_model(**parsed_json)

            # Log trace
            db_client.log_agent_trace(
                instrument=instrument,
                cycle_id=cycle_id,
                agent_role=self.role_name,
                inputs={"user_content": input_data},
                outputs=result.model_dump(),
                prompt_tokens=response.usage.prompt_tokens if response.usage else None,
                completion_tokens=response.usage.completion_tokens if response.usage else None,
                provider=provider_used
            )

            return result

        except Exception as e:
            print(f"[{self.role_name}] Error during LLM call: {e}")
            # Log failure trace
            db_client.log_agent_trace(
                instrument=instrument,
                cycle_id=cycle_id,
                agent_role=self.role_name,
                inputs={"user_content": input_data},
                outputs={"error": str(e)},
                provider=provider_used
            )
            return None
