from fastapi import APIRouter

router = APIRouter(tags=["Estado del servidor"])


@router.get("/health")
def estado_servidor():
    return {"status": "ok"}
