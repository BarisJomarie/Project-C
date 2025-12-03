from transformers import TrainingArguments

print("Transformers version check...")
import transformers
print("Transformers version:", transformers.__version__)

print("\nTrainingArguments args:")
print(TrainingArguments.__init__.__code__.co_varnames)
