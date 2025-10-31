import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

def get_gemini_api_key():
    # Only use environment variable
    return os.getenv('GEMINI_API_KEY')

# Use Gemini 2.0 model as default
GEMINI_2_MODEL = "gemini-2.5-pro"

def generate_diet_plan_with_gemini(prompt: str, model_name: str = GEMINI_2_MODEL) -> str:
    api_key = "AIzaSyBBhScaiBeqxdeCN8MBz_sT2-0uwhb6Img"
    if not api_key:
        raise ValueError("Gemini API key not found. Set GEMINI_API_KEY env variable.")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(prompt)
    return response.text if hasattr(response, 'text') else str(response) 