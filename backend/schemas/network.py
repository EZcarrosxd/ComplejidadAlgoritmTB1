from pydantic import BaseModel, Field


class Linea(BaseModel):
    origen: str
    destino: str
    capacidad: float
    costo: float


class LineaCorte(BaseModel):
    origen: str
    destino: str


class NodoVisual(BaseModel):
    id: str
    label: str
    color: str
    grado: int


class ImpactoCritico(BaseModel):
    id: str
    nodos_aislados: int
    aislados_visibles: list[str]


class AristaVisual(BaseModel):
    origen: str = Field(alias="from")
    to: str


class GrafoVisual(BaseModel):
    nodos: list[NodoVisual]
    aristas: list[AristaVisual]
