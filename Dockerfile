FROM python:3.10-slim

WORKDIR /app

# Install dependencies first to leverage Docker layer caching
COPY backend-requirements.txt .
RUN pip install --no-cache-dir -r backend-requirements.txt

# Copy the rest of the application
COPY . .

# Run the application
CMD ["python", "-m", "src.main"]
