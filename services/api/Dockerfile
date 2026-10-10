# Build the browser client once and serve it from the same-origin API container.
FROM node:22-alpine AS web-builder
WORKDIR /workspace/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    WEB_DIST=/app/web/dist
WORKDIR /app

COPY services/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade "pip>=26.2" "setuptools>=83.0.0" \
    && pip install --no-cache-dir -r requirements.txt
COPY services/api/app ./app
COPY services/api/data ./data
COPY --from=web-builder /workspace/apps/web/dist ./web/dist

RUN groupadd --system --gid 10001 appuser \
    && useradd --system --uid 10001 --gid appuser --home-dir /nonexistent appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=3)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
