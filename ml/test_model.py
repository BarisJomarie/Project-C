from transformers import AutoModelForSequenceClassification, AutoTokenizer

model = AutoModelForSequenceClassification.from_pretrained("Klasik4444/earist_sdg_classification")
tokenizer = AutoTokenizer.from_pretrained("Klasik4444/earist_sdg_classification")

inputs = tokenizer("Ensure access to clean water and sanitation", return_tensors="pt")
outputs = model(**inputs)
predicted_class = outputs.logits.argmax(dim=1).item()
print("Predicted SDG class:", predicted_class)
