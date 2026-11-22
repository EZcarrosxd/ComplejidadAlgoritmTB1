from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.api import ejemplo, georreferenciado, health, paginas
from backend.api.cors import configurar_cors
from backend.api.errores import registrar_errores
from backend.config import FRONTEND


def crear_app():
    app = FastAPI(title="Análisis de redes eléctricas", version="3.0.0")
    registrar_errores(app)
    configurar_cors(app)
    app.include_router(health.router)
    app.include_router(ejemplo.router)
    app.include_router(georreferenciado.router)
    app.include_router(paginas.router)
    app.mount("/static", StaticFiles(directory=str(FRONTEND / "static")), name="static")
    app.mount("/templates", StaticFiles(directory=str(FRONTEND / "templates")), name="templates")
    return app
