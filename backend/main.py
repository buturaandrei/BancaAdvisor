from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import init_db
from routes.mutui import router as mutui_router
from routes.confronto import router as confronto_router
from routes.advisor import router as advisor_router
from routes.settings import router as settings_router
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="BancaAdvisor",
    description="Gestore e consulente mutui con AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mutui_router)
app.include_router(confronto_router)
app.include_router(advisor_router)
app.include_router(settings_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "BancaAdvisor"}


# Serve frontend static files in production
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
