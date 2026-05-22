FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libpq-dev libgomp1 && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app/ ./app/

# Model and catalog data embedded in image (no volume mount needed)
COPY ai/models/best_model.pkl ./models/best_model.pkl
COPY datasets/output/diagnosis_codes.csv ./data/diagnosis_codes.csv
COPY datasets/output/procedure_codes.csv ./data/procedure_codes.csv

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
