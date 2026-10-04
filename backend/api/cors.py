import os

from fastapi.middleware.cors import CORSMiddleware


def configurar_cors(app):

    valor = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000")
    origenes = [origen.strip().rstrip("/") for origen in valor.split(",") if origen.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origenes,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
