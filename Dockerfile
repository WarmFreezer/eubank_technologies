FROM node:22-slim AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /srv
COPY app/requirements.txt app/
RUN pip install --no-cache-dir -r app/requirements.txt
COPY app/ app/
COPY --from=frontend /frontend/dist frontend/dist
# Railway injects $PORT.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
