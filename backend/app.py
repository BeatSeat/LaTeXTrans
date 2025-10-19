import os
import re
import time
from typing import Optional, List, Dict, Any
import asyncio
import uuid

import jwt
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Header
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests

from src.agents.coordinator_agent import CoordinatorAgent
from src.formats.latex.utils import (
    batch_download_arxiv_tex,
    extract_compressed_files,
    get_arxiv_category,
)


class TranslateRequest(BaseModel):
    arxiv_id: str
    model: Optional[str] = None
    url: Optional[str] = None
    key: Optional[str] = None
    output: Optional[str] = None
    source: Optional[str] = None


app = FastAPI(title="LaTeXTrans Backend", version="0.3.0")

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
APP_PASSWORD = os.environ.get("APP_PASSWORD", "")
TOKEN_TTL_SECONDS = int(os.environ.get("TOKEN_TTL_SECONDS", "604800"))  # default 7d
ARXIV_BASE_URL = os.environ.get("ARXIV_BASE_URL", "https://arxiv.org").rstrip("/")


class LoginRequest(BaseModel):
    password: str


def create_token() -> str:
    payload = {"exp": int(time.time()) + TOKEN_TTL_SECONDS, "sub": "user"}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"sub": "user"}

# ------------------------------
# Simple in-memory job queue
# ------------------------------
class Job(BaseModel):
    id: str
    arxiv_id: str
    status: str  # queued|running|completed|failed
    progress: int = 0
    message: str = ""
    created_at: int = 0
    updated_at: int = 0
    position: int = 0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    # Optional per-job overrides
    model: Optional[str] = None
    url: Optional[str] = None
    key: Optional[str] = None


jobs: Dict[str, Job] = {}
queue: "asyncio.Queue[str]" = asyncio.Queue()
queued_ids: List[str] = []


def _now() -> int:
    return int(time.time())


async def _worker():
    while True:
        job_id = await queue.get()
        job = jobs.get(job_id)
        if not job:
            queue.task_done()
            continue
        if job_id in queued_ids:
            queued_ids.remove(job_id)
        job.status = "running"
        job.updated_at = _now()
        jobs[job_id] = job
        try:
            await asyncio.to_thread(_process_job, job_id)
            job = jobs[job_id]
            job.status = "completed"
            job.progress = 100
            job.message = "完成"
            job.updated_at = _now()
            jobs[job_id] = job
        except Exception as e:
            job = jobs[job_id]
            job.status = "failed"
            job.error = str(e)
            job.updated_at = _now()
            jobs[job_id] = job
        finally:
            queue.task_done()


@app.on_event("startup")
async def _startup():
    asyncio.create_task(_worker())


def _set_job_progress(job_id: str, progress: int, message: str):
    job = jobs.get(job_id)
    if not job:
        return
    job.progress = progress
    job.message = message
    job.updated_at = _now()
    jobs[job_id] = job


def _find_latest_pdf(arxiv_id: str, output_dir: str) -> Optional[Dict[str, str]]:
    pat = re.compile(rf"^ch_arXiv-{re.escape(arxiv_id)}v(\d+)$")
    best = None
    best_mtime = -1
    if not os.path.isdir(output_dir):
        return None
    for name in os.listdir(output_dir):
        m = pat.match(name)
        if not m:
            continue
        version = m.group(1)
        pdf_path = os.path.join(output_dir, name, f"{name}.pdf")
        if os.path.isfile(pdf_path):
            st = os.stat(pdf_path)
            if st.st_mtime > best_mtime:
                best_mtime = st.st_mtime
                best = {"version": version, "pdf_path": pdf_path}
    return best


def _process_job(job_id: str):
    job = jobs[job_id]
    base_dir = os.getcwd()
    # Build config from environment variables (no TOML)
    llm_base_url = (job.url or os.environ.get("LTX_BASE_URL") or os.environ.get("BASE_URL") or "").strip()
    llm_api_key = (job.key or os.environ.get("LTX_API_KEY") or os.environ.get("API_KEY") or "").strip()
    llm_model = (job.model or os.environ.get("LTX_MODEL") or os.environ.get("MODEL") or "").strip()
    try:
        llm_concurrency = int(os.environ.get("LTX_CONCURRENCY", os.environ.get("CONCURRENCY", "10")))
    except ValueError:
        llm_concurrency = 10

    config: Dict[str, Any] = {
        "sys_name": os.environ.get("LTX_SYS_NAME", "LaTeXTrans"),
        "version": os.environ.get("LTX_VERSION", "0.1.0"),
        "target_language": os.environ.get("LTX_TARGET_LANGUAGE", "ch"),
        "source_language": os.environ.get("LTX_SOURCE_LANGUAGE", "en"),
        "paper_list": [],
        # always use /tmp for runtime inside container
        "tex_sources_dir": "/tmp/tex_sources",
        "output_dir": "/tmp/outputs",
        "category": {},
        "update_term": os.environ.get("LTX_UPDATE_TERM", "False"),
        "mode": int(os.environ.get("LTX_MODE", "0")),
        "user_term": os.environ.get("LTX_USER_TERM", ""),
        "llm_config": {
            "model": llm_model,
            "api_key": llm_api_key,
            "base_url": llm_base_url,
            "concurrency": llm_concurrency,
        },
    }

    projects_dir = os.path.join(base_dir, config.get("tex_sources_dir", "tex source"))
    output_dir = os.path.join(base_dir, config.get("output_dir", "outputs"))

    os.makedirs(projects_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    _set_job_progress(job_id, 10, "下载源文件")
    paper_list = [job.arxiv_id]
    projects = batch_download_arxiv_tex(paper_list, projects_dir)
    _set_job_progress(job_id, 35, "解压与准备")
    if not config.get("user_term"):
        config["category"] = get_arxiv_category(paper_list)
    extract_compressed_files(projects_dir)
    _set_job_progress(job_id, 50, "开始翻译")

    for project_dir in projects:
        agent = CoordinatorAgent(
            config=config,
            project_dir=project_dir,
            output_dir=output_dir,
        )
        agent.workflow_latextrans()

    _set_job_progress(job_id, 90, "整理结果")
    latest = _find_latest_pdf(job.arxiv_id, output_dir)
    if latest:
        jobs[job_id].result = {
            "arxiv_id": job.arxiv_id,
            "version": latest["version"],
            "pdf_endpoint": f"/api/pdf/{job.arxiv_id}/{latest['version']}"
        }


@app.post("/api/translate")
async def translate(req: TranslateRequest, user=Depends(get_current_user)):
    arxiv_id = (req.arxiv_id or "").strip()
    if not arxiv_id:
        raise HTTPException(status_code=400, detail="Missing arxiv_id")

    job_id = uuid.uuid4().hex
    job = Job(
        id=job_id,
        arxiv_id=arxiv_id,
        status="queued",
        progress=0,
        message="排队中",
        created_at=_now(),
        updated_at=_now(),
        position=len(queued_ids) + 1,
        # optional overrides from request
        model=(req.model or None),
        url=(req.url or None),
        key=(req.key or None),
    )
    jobs[job_id] = job
    queued_ids.append(job_id)
    await queue.put(job_id)

    return JSONResponse({
        "status": "accepted",
        "message": f"任务创建成功: {arxiv_id}",
        "job_id": job_id,
        "position": job.position,
    }, status_code=202)


@app.get("/api/ping")
async def ping():
    return {"status": "ok"}


@app.post("/api/login")
async def login(req: LoginRequest):
    if not APP_PASSWORD:
        raise HTTPException(status_code=500, detail="Server password not configured")
    if req.password != APP_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token()
    return {"access_token": token, "token_type": "bearer"}


def _scan_history(output_dir: str):
    results: List[dict] = []
    if not os.path.isdir(output_dir):
        return results
    pat = re.compile(r"^ch_arXiv-(?P<id>[\w\.\-]+)v(?P<ver>\d+)$")
    for name in os.listdir(output_dir):
        m = pat.match(name)
        if not m:
            continue
        item_dir = os.path.join(output_dir, name)
        if not os.path.isdir(item_dir):
            continue
        pdf_path = os.path.join(item_dir, f"{name}.pdf")
        if os.path.isfile(pdf_path):
            st = os.stat(pdf_path)
            results.append({
                "arxiv_id": m.group("id"),
                "version": m.group("ver"),
                "pdf": pdf_path,
                "mtime": int(st.st_mtime),
            })
    results.sort(key=lambda x: x["mtime"], reverse=True)
    return results


@app.get("/api/history")
async def history(user=Depends(get_current_user)):
    output_dir = "/tmp/outputs"
    return {"data": _scan_history(output_dir)}


@app.get("/api/pdf/{arxiv_id}/{version}")
async def get_pdf(arxiv_id: str, version: str, user=Depends(get_current_user)):
    name = f"ch_arXiv-{arxiv_id}v{version}"
    pdf_path = os.path.join("/tmp/outputs", name, f"{name}.pdf")
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf")


@app.get("/api/original_pdf/{arxiv_id}")
async def get_original_pdf(arxiv_id: str, user=Depends(get_current_user)):
    # Cache original PDF under /tmp/outputs/originals
    cache_dir = os.path.join("/tmp", "outputs", "originals")
    os.makedirs(cache_dir, exist_ok=True)
    pdf_path = os.path.join(cache_dir, f"{arxiv_id}.pdf")
    if not os.path.isfile(pdf_path):
        url = f"{ARXIV_BASE_URL}/pdf/{arxiv_id}.pdf"
        def _download():
            r = requests.get(url, timeout=30)
            if r.status_code != 200:
                raise RuntimeError(f"Failed to fetch original pdf: {r.status_code}")
            with open(pdf_path, "wb") as f:
                f.write(r.content)
        await asyncio.to_thread(_download)
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="Original PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf")


@app.get("/api/jobs")
async def list_jobs(user=Depends(get_current_user)):
    for i, jid in enumerate(queued_ids, start=1):
        if jid in jobs:
            jobs[jid].position = i
    data = [jobs[jid].dict() for jid in list(jobs.keys())[::-1]][:100]
    return {"data": data}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str, user=Depends(get_current_user)):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == "queued" and job.id in queued_ids:
        job.position = queued_ids.index(job.id) + 1
    return job.dict()


# Serve built frontend (Vite/Solid) from webview/dist
dist_dir = os.path.join(os.getcwd(), "webview", "dist")
if os.path.isdir(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")
