from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.api import example, health, pages, results, upload
from backend.api.cors import configurar_cors
from backend.api.errors import registrar_errores
from backend.config import FRONTEND
from backend.data.csv_reader import LectorCsv
from backend.data.json_reader import LectorJson
from backend.data.loader import CargadorDataset
from backend.services.analysis import AnalizadorRed


def crear_app():
    app = FastAPI(title="Análisis de redes eléctricas", version="2.0.0")
    app.state.cargador = CargadorDataset({".json": LectorJson(), ".csv": LectorCsv()})
    app.state.analizador = AnalizadorRed()
    app.state.resultado = None
    registrar_errores(app)
    configurar_cors(app)
    app.include_router(health.router)
    app.include_router(upload.router)
    app.include_router(example.router)
    app.include_router(results.router)
    app.include_router(pages.router)
    app.mount("/static", StaticFiles(directory=str(FRONTEND / "static")), name="static")
    app.mount("/templates", StaticFiles(directory=str(FRONTEND / "templates")), name="templates")
    return app
