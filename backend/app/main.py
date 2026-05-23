from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.rate_limit import rate_limit_middleware
from app.db.database import init_db
from app.routers import auth, tenant, project, image, annotation, dataset, prelabel, training, evaluation, model
from app.routers import audit, deployment, notification, export_router, user_management

init_db()

app = FastAPI(title=f"{settings.APP_NAME} - 工业视觉平台", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_rate_limit(request, call_next):
    return await rate_limit_middleware(request, call_next)

app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/static/thumbnails", StaticFiles(directory=settings.THUMBNAIL_DIR), name="thumbnails")

app.include_router(auth.router)
app.include_router(tenant.router)
app.include_router(project.router)
app.include_router(image.router)
app.include_router(annotation.router)
app.include_router(dataset.router)
app.include_router(prelabel.router)
app.include_router(training.router)
app.include_router(evaluation.router)
app.include_router(model.router)
app.include_router(audit.router)
app.include_router(deployment.router)
app.include_router(notification.router)
app.include_router(export_router.router)
app.include_router(user_management.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/config")
def app_config():
    return {"app_name": settings.APP_NAME}
