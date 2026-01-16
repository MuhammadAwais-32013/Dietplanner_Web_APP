import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Default Gemini model (Fast + Free-tier friendly)
DEFAULT_MODEL = "gemini-2.5-flash-lite"


def get_gemini_api_key():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    return api_key


def generate_diet_plan_with_gemini(
    prompt: str,
    model_name: str = DEFAULT_MODEL
) -> str:
    try:
        # Configure Gemini
        genai.configure(api_key=get_gemini_api_key())

        # Load model
        model = genai.GenerativeModel(model_name)

        # Generate content
        response = model.generate_content(prompt)

        return response.text if response and hasattr(response, "text") else "No response generated"

    except Exception as e:
        # Log error (important for backend)
        print("Gemini API Error:", e)

        # Graceful fallback response
        return "AI service is temporarily unavailable. Please try again later."
