FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# system deps for some python packages (if needed)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# copy requirements first for docker layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# copy app source
COPY . /app

# Expose port (internal)
EXPOSE 5000

# Use gunicorn with eventlet for SocketIO support
CMD ["/usr/local/bin/gunicorn", "-k", "eventlet", "-w", "1", "backend.app:app", "--bind", "0.0.0.0:5000", "--chdir", "/app"]
