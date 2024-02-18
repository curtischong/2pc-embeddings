from transformers import BertTokenizer, BertModel
import torch

# Initialize the tokenizer and model
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

def generate_embeddings(profile) -> list:
    input_text = f"Personality Type: {profile['MBTI']} Love Languages: {profile['Love_Languages']}. Enjoys {profile['Hobbies']}"
    inputs_tokenized = tokenizer(input_text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs_tokenized)
    embeddings = outputs.last_hidden_state
    mean_embeddings = embeddings.mean(dim=1)

    return mean_embeddings.tolist()[0]

if __name__ == '__main__':
    # Example structured input data
    profile = {
        "MBTI": "INFP - imaginative, open-minded, and curious. Loves exploring new ideas and values personal freedom.",
        "Love_Languages": "Quality Time, Words of Affirmation - enjoys deep conversations, feeling appreciated through words.",
        "Hobbies": "reading fantasy novels, hiking in nature, creative writing."
    }

    mean_embeddings = generate_embeddings(profile)
    
