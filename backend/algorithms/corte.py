from collections import deque


def obtener_corte_minimo(grafo_residual, aristas, origen):

    alcanzables = {origen}
    cola = deque([origen])

    while cola:
        u = cola.popleft()
        for v, capacidad in grafo_residual[u].items():
            if v not in alcanzables and capacidad > 0:
                alcanzables.add(v)
                cola.append(v)

    return [
        {'origen': arista['origen'], 'destino': arista['destino']}
        for arista in aristas
        if (arista['origen'] in alcanzables) != (arista['destino'] in alcanzables)
    ]
