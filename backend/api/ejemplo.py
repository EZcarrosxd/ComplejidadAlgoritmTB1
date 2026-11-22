from fastapi import APIRouter
from fastapi.responses import FileResponse

from backend.config import RED_EJEMPLO

router = APIRouter(prefix="/api", tags=["Análisis"])


@router.get("/ejemplo")
def dataset_ejemplo():
    return FileResponse(RED_EJEMPLO, media_type="application/json", filename=RED_EJEMPLO.name)
