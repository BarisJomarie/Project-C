
from transformers import BertTokenizer, BertForSequenceClassification, BertTokenizerFast
import torch
import os

# Load model once
model_path = "/mnt/volume/final_model"
tokenizer = BertTokenizerFast.from_pretrained(model_path)
model = BertForSequenceClassification.from_pretrained(model_path)
model.eval() # Set model to evaluation mode


# Labels mapping
id2label = {
    0: "No Poverty",
    1: "Zero Hunger",
    2: "Good Health and Well-being",
    3: "Quality Education",
    4: "Gender Equality",
    5: "Clean Water and Sanitation",
    6: "Affordable and Clean Energy",
    7: "Decent Work and Economic Growth",
    8: "Industry, Innovation and Infrastructure",
    9: "Reduced Inequalities",
    10: "Sustainable Cities and Communities",
    11: "Responsible Consumption and Production",
    12: "Climate Action",
    13: "Life Below Water",
    14: "Life on Land",
    15: "Peace, Justice and Strong Institutions",
    16: "Partnerships for the Goals",
}

# Function to predict SDG index and label
def predict_sdg(text_input):
  inputs = tokenizer(text_input, return_tensors='pt', truncation=True, padding=True, max_length=512)
  with torch.no_grad():
      outputs = model(**inputs)
      probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
      predicted_label = torch.argmax(probs).item()
      confidence = torch.max(probs).item()

  return {
      'sdg_index': predicted_label,
      'prediction': id2label[predicted_label],
      'confidence': round(confidence, 4),
      'probabilities': probs.tolist()[0]
  }