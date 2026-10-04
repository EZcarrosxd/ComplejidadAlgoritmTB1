from fastapi import APIRouter
from fastapi.responses import FileResponse

from backend.config import FRONTEND

router = APIRouter()


@router.get("/", include_in_schema=False)
def inicio():
    return FileResponse(FRONTEND / "index.html")
