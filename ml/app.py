from fastapi import FastAPI
from pydantic import BaseModel
from sdg_prediction import predict_sdg
from ai_analysis import analyze_text
import os
import shutil

app = FastAPI()

class TextInput(BaseModel):
    text: str
    
@app.on_event("startup")
def copy_model_to_volume():
    src = os.path.join(os.path.dirname(__file__), "final_model")
    dst = "/mnt/volume/final_model"
    if not os.path.exists(dst):
        shutil.copytree(src, dst)
        print("Model copied to volume at startup.")
    else:
        print("Model already exists in volume. Skipping copy.")


@app.get("/")
def root():
    return {"message": "ML microservice running!"}

@app.post("/predict-sdg")
async def predict_sdg_endpoint(input_data: TextInput):
    result = predict_sdg(input_data.text)
    return result

@app.post("/analyze-text")
async def analyze_text_endpoint(input_data: TextInput):
    result = analyze_text(input_data.text)
    return result