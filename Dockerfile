# ------------------------------------------------------------
# Frontend build stage
# ------------------------------------------------------------
FROM node:18-alpine AS frontend
WORKDIR /app/webview

# Enable corepack to use pnpm matching the lockfile
RUN corepack enable

# Copy web assets
COPY webview/ ./

# Install and build
RUN pnpm install --frozen-lockfile \
 && pnpm build

# ------------------------------------------------------------
# Backend stage
# ------------------------------------------------------------
FROM python:3.11-slim AS backend
WORKDIR /app

# System deps + MiKTeX LaTeX toolchain (for EN->ZH compiling)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    gnupg \
    wget \
    perl \
 && rm -rf /var/lib/apt/lists/*

# Add MiKTeX apt repository and install
RUN set -eux; \
    wget -qO- https://miktex.org/download/gpg | gpg --dearmor > /usr/share/keyrings/miktex-archive-keyring.gpg; \
    echo "deb [signed-by=/usr/share/keyrings/miktex-archive-keyring.gpg] https://miktex.org/download/linux/debian bookworm universe" > /etc/apt/sources.list.d/miktex.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends miktex; \
    miktexsetup --quiet finish; \
    initexmf --admin --set-config-value "[MPM]AutoInstall=1"; \
    mpm --admin --update-db; \
    mpm --admin --update; \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# App source
COPY src/ ./src/
COPY backend/ ./backend/
COPY main.py ./main.py

# Frontend dist -> serve as static files
COPY --from=frontend /app/webview/dist ./webview/dist

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

USER 10043

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
