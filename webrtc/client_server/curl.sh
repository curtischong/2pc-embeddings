#!/bin/bash

curl -X 'POST' \
  'http://localhost:7999/embeddings' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
        "MBTI": "INFP - imaginative, open-minded, and curious. Loves exploring new ideas and values personal freedom.",
        "Love_Languages": "Quality Time, Words of Affirmation - enjoys deep conversations, feeling appreciated through words.",
        "Hobbies": "reading fantasy novels, hiking in nature, creative writing."
    }'
