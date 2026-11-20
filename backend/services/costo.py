from dataclasses import dataclass

from backend.algorithms.kruskal import optimizar_costos_kruskal
from backend.domain.red import RedElectrica


@dataclass(frozen=True)
class ResultadoCosto:
    aristas_mst: list[dict]
    costo_minimo: float
    costo_total: float
    componentes: int


def analizar_costo(red: RedElectrica) -> ResultadoCosto:
    aristas_mst, costo_minimo = optimizar_costos_kruskal(red.nodos, red.aristas)
    return ResultadoCosto(
        aristas_mst=aristas_mst,
        costo_minimo=round(costo_minimo, 2),
        costo_total=round(sum(arista["costo"] for arista in red.aristas), 2),
        componentes=len(red.nodos) - len(aristas_mst),
    )
