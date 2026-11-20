from fastapi import APIRouter
from fastapi.responses import FileResponse

from backend.config import DATASET

router = APIRouter(prefix="/api", tags=["Análisis"])


@router.get("/ejemplo")
def dataset_ejemplo():
    return FileResponse(DATASET, media_type="application/json", filename="dataset.json")
