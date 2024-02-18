from transformers import BertTokenizer, BertModel
import torch

# Initialize the tokenizer and model
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# Example structured input data
profile = {
    "MBTI": "INFP - imaginative, open-minded, and curious. Loves exploring new ideas and values personal freedom.",
    "Love_Languages": "Quality Time, Words of Affirmation - enjoys deep conversations, feeling appreciated through words.",
    "Hobbies": "reading fantasy novels, hiking in nature, creative writing."
}

# Combining inputs into a single text string
input_text = f"Personality Type: {profile['MBTI']} Love Languages: {profile['Love_Languages']}. Enjoys {profile['Hobbies']}"

# Tokenize input and convert to tensors
inputs = tokenizer(input_text, return_tensors="pt", padding=True, truncation=True, max_length=512)

# Get embeddings
with torch.no_grad():
    outputs = model(**inputs)

# The last hidden state is the embeddings
embeddings = outputs.last_hidden_state

# You might want to take the mean of the embeddings for the entire input sequence
mean_embeddings = embeddings.mean(dim=1)

print(mean_embeddings.size())
