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

# System deps + TeX Live LaTeX toolchain (avoid MiKTeX bot-protected repo)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    wget \
    perl \
    # TeX Live components for XeLaTeX + CJK (Chinese) support
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-xetex \
    texlive-lang-chinese \
    fonts-noto-cjk \
    latexmk \
 && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# App source
COPY src/ ./src/
COPY backend/ ./backend/
COPY main.py ./main.py
COPY terms/ ./terms/

# Frontend dist -> serve as static files
COPY --from=frontend /app/webview/dist ./webview/dist

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

USER 10043

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
