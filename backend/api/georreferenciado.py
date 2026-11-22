from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, conlist

from backend.services.georreferenciado import analizar_georreferenciado

router = APIRouter(prefix="/api/georreferenciado", tags=["Red georreferenciada"])


class GrafoCompacto(BaseModel):
    algoritmo: Literal["kruskal", "prim", "bfs"]
    nodos: list[str]
    aristas: list[conlist(int, min_length=3, max_length=3)]


@router.post("/analizar")
def analizar(grafo: GrafoCompacto):
    try:
        return analizar_georreferenciado(grafo.algoritmo, grafo.nodos, grafo.aristas)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
