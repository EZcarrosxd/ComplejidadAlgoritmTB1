from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


MAXIMO_ENTERO_JSON = 2**53 - 1
Identificador = Annotated[str, Field(pattern=r"\S")]
Coordenadas = Annotated[list[float], Field(min_length=2, max_length=2)]
Algoritmo = Literal["kruskal", "prim", "bfs"]
PrecioPorMetro = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=4, allow_inf_nan=False)]


def validar_coordenadas(coordenadas):
    longitud, latitud = coordenadas
    if not (-180 <= longitud <= 180 and -90 <= latitud <= 90):
        raise ValueError("Usa coordenadas WGS 84 en orden longitud, latitud")


class ObjetoDeRed(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class Nodo(ObjetoDeRed):
    id: Identificador
    coordenadas: Coordenadas


class Arista(ObjetoDeRed):
    id: Identificador
    origen: Identificador
    destino: Identificador
    peso_mm: Annotated[int, Field(gt=0, le=MAXIMO_ENTERO_JSON)]
    clase: Literal["tramo_documentado", "candidata_geografica"]
    trazado: Annotated[list[Coordenadas], Field(min_length=3)] | None = None

    @model_validator(mode="after")
    def validar_trazado(self):
        if self.trazado is None and "trazado" in self.model_fields_set:
            raise ValueError("Omite el trazado si la conexión es recta")
        return self


class Grafo(ObjetoDeRed):
    nodos: Annotated[list[Nodo], Field(min_length=1)]
    aristas: list[Arista]

    @model_validator(mode="after")
    def validar_grafo(self):
        posiciones = {}
        for nodo in self.nodos:
            if nodo.id in posiciones:
                raise ValueError(f"El identificador de nodo {nodo.id} está repetido")
            validar_coordenadas(nodo.coordenadas)
            posiciones[nodo.id] = nodo.coordenadas

        ids = set()
        for arista in self.aristas:
            if arista.id in ids:
                raise ValueError(f"El identificador de arista {arista.id} está repetido")
            ids.add(arista.id)
            inicio = posiciones.get(arista.origen)
            fin = posiciones.get(arista.destino)
            if inicio is None or fin is None or arista.origen == arista.destino:
                raise ValueError(f"La arista {arista.id} tiene extremos inválidos")
            if arista.trazado is not None:
                for posicion in arista.trazado:
                    validar_coordenadas(posicion)
                if arista.trazado[0] != inicio or arista.trazado[-1] != fin:
                    raise ValueError(f"El trazado de {arista.id} debe comenzar en el origen y terminar en el destino")
        return self
