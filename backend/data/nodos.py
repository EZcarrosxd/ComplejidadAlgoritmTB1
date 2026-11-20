from backend.domain.errores import ErrorValidacionDatos
from .valores import identificador


def normalizar_nodos(datos, aristas, minimo):
    nodos = {}
    if "nodos" in datos:
        if not isinstance(datos["nodos"], list):
            raise ErrorValidacionDatos("nodos debe ser una lista de objetos con id")
        for fila in datos["nodos"]:
            if not isinstance(fila, dict):
                raise ErrorValidacionDatos("Cada nodo debe ser un objeto con id")
            clave = identificador(fila.get("id"))
            if clave in nodos:
                raise ErrorValidacionDatos(f"Nodo repetido: {clave}")
            nodos[clave] = fila
    for arista in aristas:
        for extremo in ("origen", "destino"):
            clave = arista[extremo]
            if "nodos" in datos and clave not in nodos:
                raise ErrorValidacionDatos(f"La conexión referencia un nodo inexistente: {clave}")
            nodos.setdefault(clave, {})
    if len(nodos) < minimo:
        raise ErrorValidacionDatos(f"El dataset tiene {len(nodos)} nodos; se requieren {minimo}")
    return nodos
