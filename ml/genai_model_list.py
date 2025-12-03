import os
import google.generativeai as genai

# Use your environment variable or directly your API key
api_key = os.environ.get("GOOGLE_API_KEY", "AIzaSyCpkSm0QRF0cQrtcBnk1I9NlIQ9YFASPvc")
genai.configure(api_key=api_key)

# List all available models
models = list(genai.list_models())  # Convert generator to list

# Print model info
for m in models:
    print(m)
