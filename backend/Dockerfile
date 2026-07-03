FROM python:3.11-slim AS base

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY core/ ./core/
COPY data/ ./data/
COPY model_training/ ./model_training/
COPY utils/ ./utils/
COPY api/ ./api/

# Create results directory
RUN mkdir -p ./results/runs

# Environment
ENV NEUROTRADE_HOST=0.0.0.0
ENV NEUROTRADE_PORT=5001
ENV NEUROTRADE_DEBUG=false
ENV NEUROTRADE_LOG_JSON=true
ENV NEUROTRADE_LOG_LEVEL=INFO
ENV NEUROTRADE_CORS_ORIGINS=*
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

EXPOSE 5001

CMD ["python", "api/app.py"]
