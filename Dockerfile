# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install only minimal system dependencies (no dev packages)
# This significantly reduces memory usage during build
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
# Use --no-cache-dir to reduce memory usage
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/

# Create necessary directories
RUN mkdir -p uploads logs models/face_embeddings

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=10000

# Expose port
EXPOSE 10000

# Run the application (use $PORT env var for flexibility)
CMD python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-10000}
