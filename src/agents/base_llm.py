import json
import os
from typing import Type, Any, Dict, Optional, List
from pydantic import BaseModel
import litellm
from src.config import settings
from src.services.supabase_client import db_client

# Suppress litellm logging if needed
litellm.set_verbose = False

class BaseAgent:
    def __init__(self, role_name: str, system_prompt: str, response_model: Type[BaseModel], model_name: str, api_keys: List[str]):
        self.role_name = role_name
        self.system_prompt = system_prompt
        self.response_model = response_model

        self.model_name = model_name
        self.api_keys = [k for k in api_keys if k] # Keep only non-empty keys
        self.current_key_idx = 0

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
        Runs the LLM call with manual round-robin key rotation for the same provider.
        Parses output into Pydantic model and logs trace to Supabase.
        """
        if not self.api_keys:
            print(f"[{self.role_name}] Skipping LLM call, API keys not configured.")
            return None

        messages = self._format_prompt(input_data)
        schema = self.response_model.model_json_schema()

        attempts = 0
        max_attempts = len(self.api_keys)

        # Max validation retries allowed per API key attempt
        max_validation_retries = 1

        while attempts < max_attempts:
            api_key = self.api_keys[self.current_key_idx]

            # Update next index for round-robin across all successive calls
            self.current_key_idx = (self.current_key_idx + 1) % len(self.api_keys)

            validation_retries = 0
            while validation_retries <= max_validation_retries:
                try:
                    response = litellm.completion(
                        model=self.model_name,
                        messages=messages,
                        api_key=api_key,
                        response_format={"type": "json_object", "schema": schema},
                        temperature=0.0 # Lowest temp for deterministic reasoning
                    )

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
                        provider=self.model_name
                    )

                    return result

                except litellm.exceptions.RateLimitError as e:
                    print(f"[{self.role_name}] Rate limit error on key index {(self.current_key_idx - 1) % len(self.api_keys)}: {e}")
                    attempts += 1
                    if attempts < max_attempts:
                        print(f"[{self.role_name}] Rotating to next API key...")
                    else:
                        print(f"[{self.role_name}] All API keys exhausted due to rate limits.")
                        db_client.log_agent_trace(
                            instrument=instrument,
                            cycle_id=cycle_id,
                            agent_role=self.role_name,
                            inputs={"user_content": input_data},
                            outputs={"error": f"Rate limit exhausted across all {max_attempts} keys: {e}"},
                            provider=self.model_name
                        )
                    # Break out of the validation retry loop to move to the next API key (if any)
                    break

                except Exception as e:
                    print(f"[{self.role_name}] Error during LLM call or validation: {e}")
                    validation_retries += 1
                    if validation_retries <= max_validation_retries:
                        print(f"[{self.role_name}] Retrying LLM call (validation attempt {validation_retries + 1})...")
                        continue
                    else:
                        # Log failure trace after exhausting validation retries
                        db_client.log_agent_trace(
                            instrument=instrument,
                            cycle_id=cycle_id,
                            agent_role=self.role_name,
                            inputs={"user_content": input_data},
                            outputs={"error": f"Failed after {max_validation_retries} validation retries: {str(e)}"},
                            provider=self.model_name
                        )
                        return None

        # If it exits the while loop it means all keys were rate limited or an unhandled break occurred
        return None
