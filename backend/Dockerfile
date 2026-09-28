# ==============================================================================
# Django Backend Production Dockerfile
# ==============================================================================
FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    netcat-traditional \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

RUN chmod +x /app/docker-entrypoint.sh

# Expose Django port
EXPOSE 8000

# Wait for MySQL, migrate, then start Gunicorn
CMD ["/app/docker-entrypoint.sh"]
