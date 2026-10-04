from collections import deque

from backend.config import LIMITE_VISUAL


def elegir_visibles(red, semillas):
    visibles = dict.fromkeys(list(dict.fromkeys(semillas))[:LIMITE_VISUAL])
    pendientes = deque(visibles)
    restantes = iter(red.nodos)

    while len(visibles) < min(LIMITE_VISUAL, len(red.nodos)):
        if not pendientes:
            nodo = next(n for n in restantes if n not in visibles)
            visibles[nodo] = None
            pendientes.append(nodo)
            continue
        u = pendientes.popleft()
        for conexion in red.adyacencia[u]:
            v = conexion["destino"]
            if v not in visibles and len(visibles) < LIMITE_VISUAL:
                visibles[v] = None
                pendientes.append(v)

    return list(visibles)


def crear_subgrafo(red, criticos, semillas=()):
    ids = elegir_visibles(red, semillas)
    visibles = set(ids)
    criticos = set(criticos)
    nodos = []
    for clave in ids:
        color = "#dc2626" if clave in criticos else "#3b82f6"
        nodos.append({"id": clave, "label": clave, "color": color,
                      "grado": len(red.adyacencia[clave])})
    aristas = []
    for arista in red.aristas:
        if arista["origen"] in visibles and arista["destino"] in visibles:
            aristas.append({"from": arista["origen"], "to": arista["destino"]})
    return {"nodos": nodos, "aristas": aristas}
