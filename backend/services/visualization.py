from backend.config import LIMITE_VISUAL


def crear_subgrafo(red, criticos):
    ids = list(red.nodos)[:LIMITE_VISUAL]
    visibles = set(ids)
    criticos = set(criticos)
    nodos = []
    for clave in ids:
        color = "#dc2626" if clave in criticos else "#3b82f6"
        nodos.append({"id": clave, "label": clave, "color": color})
    aristas = []
    for arista in red.aristas:
        if arista["origen"] in visibles and arista["destino"] in visibles:
            aristas.append({"from": arista["origen"], "to": arista["destino"]})
    return {"nodos": nodos, "aristas": aristas}
