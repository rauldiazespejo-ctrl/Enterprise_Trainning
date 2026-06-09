import json
from openai import AsyncOpenAI
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.config import settings

# Configure for DeepSeek
DEEPSEEK_API_KEY = settings.DEEPSEEK_API_KEY

client = AsyncOpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com"
)

# Pydantic Schemas for Strict Parsing
class InfographicStep(BaseModel):
    order: int
    action: str
    risk: Optional[str] = None
    control: Optional[str] = None

class InfographicSpec(BaseModel):
    title: str
    objective: str
    steps: List[InfographicStep]
    required_ppe: List[str] = Field(default_factory=list)
    critical_warnings: List[str] = Field(default_factory=list)

async def generate_infographic_spec(document_text: str) -> Dict[str, Any]:
    """
    Uses DeepSeek to extract operational knowledge and generate an InfographicSpec.
    We use structured JSON output and strict Pydantic validation to guarantee robustness.
    """
    prompt = f"""
    You are an expert industrial safety AI. Analyze the following procedure text and extract the key operational steps, risks, required PPE, and critical controls.
    Generate a JSON object representing an 'InfographicSpec'. Ensure keys exactly match this structure:
    {{
        "title": "string",
        "objective": "string",
        "steps": [
            {{"order": 1, "action": "string", "risk": "string or null", "control": "string or null"}}
        ],
        "required_ppe": ["string"],
        "critical_warnings": ["string"]
    }}
    
    Procedure Text:
    {document_text}
    """
    
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that strictly outputs valid JSON matching the requested schema."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    result_json = response.choices[0].message.content
    
    # Strict validation: Parse and validate via Pydantic, then convert back to dict
    validated_spec = InfographicSpec.model_validate_json(result_json)
    
    return validated_spec.model_dump()
