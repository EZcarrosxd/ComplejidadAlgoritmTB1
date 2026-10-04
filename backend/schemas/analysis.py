from typing import Literal

from pydantic import BaseModel
from .network import GrafoVisual, ImpactoCritico, Linea, LineaCorte


class Metadata(BaseModel):
    total_nodos: int
    total_aristas: int
    costo_total_red: float
    origen_flujo: str
    destino_flujo: str
    seleccion_flujo: Literal["manual", "automatica"]
    ids_nodos: list[str]
    componentes: int
    red_conectada: bool
    unidad_capacidad: str


class ResultadoAnalisis(BaseModel):
    costo_minimo_instalacion: float
    aristas_mst: list[Linea]
    flujo_maximo_red: float
    lineas_corte_minimo: list[LineaCorte]
    caminos_flujo: list[list[str]]
    nodos_criticos: list[str]
    impacto_criticos: list[ImpactoCritico]
    tiempo_ejecucion: float
    grafo_visual: GrafoVisual
    metadata: Metadata


class RespuestaCarga(BaseModel):
    mensaje: str
    datos: ResultadoAnalisis
