from typing import Annotated

from fastapi import APIRouter, Query

from backend.schemas.geografica import Algoritmo, Grafo, PrecioPorMetro
from backend.services.georreferenciado import analizar_georreferenciado

router = APIRouter(prefix="/api/georreferenciado", tags=["Red georreferenciada"])


@router.post("/{algoritmo}")
def analizar(algoritmo: Algoritmo, grafo: Grafo, precio_por_metro: Annotated[PrecioPorMetro | None, Query()] = None):
    return analizar_georreferenciado(algoritmo, grafo, precio_por_metro)
