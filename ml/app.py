from fastapi import FastAPI
from pydantic import BaseModel
from sdg_prediction import predict_sdg
from ai_analysis import analyze_text
import os
import shutil

app = FastAPI()

class TextInput(BaseModel):
    text: str

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