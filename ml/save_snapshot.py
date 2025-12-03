from transformers import BertForSequenceClassification, BertTokenizer, BertTokenizerFast

# Current checkpoint
checkpoint_folder = "./checkpoints/checkpoint-16875"

# Output folder for inference-ready model
output_folder = "./checkpoints/bert_model_full"

# Load the model (safetensors is detected automatically)
model = BertForSequenceClassification.from_pretrained(checkpoint_folder)
model.save_pretrained(output_folder)  # saves model.safetensors + config.json

# Load the tokenizer from checkpoint (vocab + config)
tokenizer = BertTokenizerFast.from_pretrained(checkpoint_folder)
tokenizer.save_pretrained(output_folder)  # generates tokenizer.json + vocab.txt + special_tokens_map.json

print(f"Full inference-ready model saved in: {output_folder}")
