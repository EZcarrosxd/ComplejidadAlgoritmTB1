from backend.config import CAPACIDAD, PRECIO_METRO
from backend.domain.errors import DatasetValidationError
from .values import identificador, numero


def normalizar_aristas(datos):
    conexiones = datos.get("conexiones")
    if not isinstance(conexiones, list) or not conexiones:
        raise DatasetValidationError("Se requiere una lista no vacía de conexiones.")
    precios = datos.get("precios", [])
    if not isinstance(precios, list) or any(not isinstance(p, dict) for p in precios):
        raise DatasetValidationError("precios debe ser una lista de objetos.")
    precio = numero(precios[0].get("precio_por_metro") if precios else PRECIO_METRO,
                    "precio_por_metro")
    aristas = []
    for indice, fila in enumerate(conexiones, 1):
        if not isinstance(fila, dict):
            raise DatasetValidationError(f"Conexión {indice}: se esperaba un objeto.")
        try:
            origen = identificador(fila.get("origen"))
            destino = identificador(fila.get("destino"))
            if origen == destino:
                raise DatasetValidationError("Los extremos deben ser distintos.")
            if "costo" in fila:
                costo = numero(fila["costo"], "costo")
            else:
                distancia = numero(fila.get("distancia_m"), "distancia_m")
                costo = numero(distancia * precio, "costo calculado")
            capacidad = numero(fila.get("capacidad", CAPACIDAD), "capacidad")
            aristas.append(dict(origen=origen, destino=destino,
                                costo=costo, capacidad=capacidad))
        except DatasetValidationError as error:
            raise DatasetValidationError(f"Conexión {indice}: {error}") from error
    return aristas
