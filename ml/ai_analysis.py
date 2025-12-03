from fastapi import FastAPI
from pydantic import BaseModel
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load environment
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY is not set!")

# Configure Gemini
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-2.5-pro")
except Exception:
    model = genai.GenerativeModel("gemini-2.5-pro-20240627")

# FastAPI setup 
app = FastAPI()

class SDGData(BaseModel):
    sdg_data: dict

# Prompt generator 
def generate_prompt(sdg_data: dict) -> str:
    return f"""
      You are an expert in Sustainable Development Goal (SDG) research analysis.

      Using the structured SDG data provided below, generate a clean, professional, and consistently formatted report styled like an institutional document (plain text, not Markdown).

      Do NOT include any report header, title, department, author, or date lines. Start the output immediately with the first numbered analysis item (i.e., the output must begin with "1. ").

      SDG Data:
      {json.dumps(sdg_data, indent=2)}

      Formatting and Style Rules (strictly follow all):

      1. Each main point must start with a numbered title using this format:
         1. Title of Section
         - No asterisks, hashes, or Markdown symbols.
         - Do not bold or italicize; plain text only.
         - There must be no extra blank lines before or after any numbered title.
         (Each title should be directly followed by its first bullet.)

      2. Each main point must be followed by bullet details.
         - Use the "•" symbol for main bullets, indented by exactly 3 spaces.
         - Example:
            1. Example Title
               • This is a main bullet.
         - Use the "▪" symbol for sub-bullets, indented by exactly 5 spaces.
         - Example:
               • Encourage research on:
                  ▪ SDG 1 (No Poverty) – Develop inclusion tools.
                  ▪ SDG 13 (Climate Action) – Create monitoring systems.

      3. Each bullet point must appear on a single line.

      4. Each numbered point must contain **at least 3 bullets** (nested bullets count toward this minimum), but you may add more if needed.

      5. After the first set of numbered points (analysis), insert the line:
         ===SPLIT===
         (uppercase, no spaces before or after, surrounded by one blank line on each side).

      6. Continue with the second set of numbered points (recommendations), following the same format.

      7. Use a formal, academic tone suitable for institutional reports.
         - Keep writing concise, factual, and professional.

      8. Only output plain text with:
         - Numbered titles (1., 2., 3., etc.)
         - "•" for main bullets (3-space indent)
         - "▪" for sub-bullets (5-space indent)

      9. Do not output any Markdown symbols such as **, ###, >*, or *.

      10. Each section (analysis and recommendations) must contain **at least 4 numbered points**, but you may include more if the data supports it.

      Example Output Format (follow exactly):

      1. Limited Coverage of Some SDGs
         • The majority of research aligns with SDG 3 (Good Health and Well-Being), SDG 4 (Quality Education), and SDG 9 (Industry, Innovation, and Infrastructure).
         • SDG 1 (No Poverty), SDG 2 (Zero Hunger), and SDG 13 (Climate Action) are minimally addressed.

      2. Need for More Interdisciplinary Research
         • Most research focuses on technology-based solutions, particularly AI and web applications.
         • Collaboration with environmental science and social sciences could yield broader impact.

      ===SPLIT===

      1. Expand Research Coverage to Less Addressed SDGs
         • Encourage research on:
         ▪ SDG 1 (No Poverty) – Develop digital inclusion tools.
         ▪ SDG 13 (Climate Action) – Create climate monitoring systems.

      2. Foster Interdisciplinary Collaboration
         • Partner across computing, environmental, and social disciplines for deeper SDG engagement.
      """

# Core AI function 
def analyze_text(sdg_data_input) -> dict:
    """
    Analyze SDG data using Gemini AI.
    Handles input as dict or JSON string.
    """
    import json

    # If input is a string, try to parse it
    if isinstance(sdg_data_input, str):
        try:
            sdg_data = json.loads(sdg_data_input)
        except json.JSONDecodeError:
            return {"error": "Invalid JSON input."}
    elif isinstance(sdg_data_input, dict):
        sdg_data = sdg_data_input
    else:
        return {"error": "Input must be a dict or JSON string."}

    # Generate prompt
    prompt = generate_prompt(sdg_data)

    try:
        response = model.generate_content(prompt)
        return {
            "analysis": response.text if response else "No analysis returned.",
            "model_used": model._model_name
        }
    except Exception as e:
        # Log the error to terminal
        print(f"[ERROR] Gemini API call failed: {e}")
        return {"error": str(e)}


# FastAPI endpoint
@app.post("/analyze-sdg")
async def analyze_sdg_endpoint(data: SDGData):
    return analyze_text(data.sdg_data)
