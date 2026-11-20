from dataclasses import dataclass

from backend.algorithms.flujo import calcular_flujo_maximo
from backend.domain.red import RedElectrica
from .extremos import seleccionar_extremos


@dataclass(frozen=True)
class ResultadoCapacidad:
    origen: str
    destino: str
    seleccion: str
    flujo_maximo: float
    corte_minimo: list[dict]
    caminos: list[list[str]]


def analizar_capacidad(red: RedElectrica, origen=None, destino=None) -> ResultadoCapacidad:
    origen, destino, seleccion = seleccionar_extremos(red, origen, destino)
    caminos = []
    flujo, corte = calcular_flujo_maximo(red.nodos, red.aristas, origen, destino, caminos)
    return ResultadoCapacidad(origen, destino, seleccion, flujo, corte, caminos)
