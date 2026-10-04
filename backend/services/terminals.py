from backend.algorithms.bfs import encontrar_nodos_mas_alejados


def seleccionar_extremos(red, origen=None, destino=None):
    origen = (origen or "").strip()
    destino = (destino or "").strip()
    if bool(origen) != bool(destino):
        raise ValueError("Indique tanto el origen como el destino, o ninguno.")
    manual = bool(origen)
    if not manual:

        inicio = next(n for n in red.nodos if red.adyacencia[n])
        origen, destino = encontrar_nodos_mas_alejados({inicio: {}}, red.adyacencia)
    if origen not in red.nodos or destino not in red.nodos:
        raise ValueError("El origen y el destino deben existir en la red.")
    if origen == destino:
        raise ValueError("El origen y el destino deben ser distintos.")
    return origen, destino, "manual" if manual else "automatica"
