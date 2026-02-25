# Use a lightweight Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Create and set working directory
WORKDIR /app

# Install system dependencies (none required for current requirements.txt, but added for common needs)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     gcc \
#     libc-dev \
#     && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source code
COPY src/ /app/src/

# Create a non-root user for security
RUN useradd -m postlyuser
USER postlyuser

# Command to run the bot
CMD ["python", "src/main.py"]
