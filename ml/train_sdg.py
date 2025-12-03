from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from datasets import load_dataset
from sklearn.metrics import f1_score, precision_score, recall_score
import numpy as np
import os
from torch.serialization import add_safe_globals
import torch
from functools import partial

#for resuming through checkpoints.
torch.load = partial(torch.load, weights_only=False)

# 1. Load dataset
dataset = load_dataset("razaulhaq/eurlex_sdg_coverage")

# Define evaluation metrics for multi-label classification
def compute_metrics(pred):
  logits, labels = pred
  preds = (logits >= 0.5).astype(int)

  return {
    "micro_f1": f1_score(labels, preds, average="micro"),
    "macro_f1": f1_score(labels, preds, average="macro"),
    "precision": precision_score(labels, preds, average="micro"),
    "recall": recall_score(labels, preds, average="micro"),
    "exact_match": (preds == labels).all(axis=1).mean()
  }

# 2. Tokenizer
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

def tokenize(batch):
  texts = [
    title + " " + text
    for title, text in zip(batch["title"], batch["text"])
  ]
  labels = [
    [int(batch[f"SDG {i}"][j] >= 0.5) for i in range(1, 18)]
    for j in range(len(batch["title"]))
  ]
  encodings = tokenizer(
    texts,
    truncation=True,
    padding="max_length",
    max_length=512
  )
  encodings["labels"] = [list(map(float, label_row)) for label_row in labels]
  return encodings

dataset = dataset.map(tokenize, batched=True) 

# 3. Load model
model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=17,
    problem_type="multi_label_classification"
)

# 4. Training arguments
training_args = TrainingArguments(
    output_dir="./checkpoints",
    evaluation_strategy="epoch",
    save_strategy="epoch",
    save_total_limit=2,
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    num_train_epochs=5,
    weight_decay=0.01,
    logging_dir="./logs",
    logging_steps=500,
)

# 5. Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    tokenizer=tokenizer,
    compute_metrics=compute_metrics
)

add_safe_globals([np.dtype, np.generic])

# Resume/Start training
checkpoint_path = "./checkpoints/checkpoint-16875"
if os.path.exists(checkpoint_path):
  print(f"Resumed training from {checkpoint_path}")
  trainer.train(resume_from_checkpoint=checkpoint_path)
else:
  trainer.train()

trainer.save_model("./checkpoints/final_model")
tokenizer.save_pretrained("./checkpoints/final_model")
