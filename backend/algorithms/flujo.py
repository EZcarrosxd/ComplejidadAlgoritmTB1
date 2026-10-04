from collections import defaultdict, deque

from .corte import obtener_corte_minimo

MAXIMO_CAMINOS = 80

def bfs_camino(grafo_residual, origen, destino, padres):
    visitado = {u: False for u in grafo_residual}
    cola = deque([origen])
    visitado[origen] = True

    while cola:
        u = cola.popleft()
        for v, capacidad in grafo_residual[u].items():
            if not visitado[v] and capacidad > 0:
                cola.append(v)
                visitado[v] = True
                padres[v] = u
                if v == destino:
                    return True
    return False

def calcular_flujo_maximo(nodos, aristas, origen, destino, caminos=None):

    if origen not in nodos or destino not in nodos:
        raise ValueError(f"El origen ({origen}) y el destino ({destino}) deben existir en la red.")
    if origen == destino:
        raise ValueError("El origen y el destino del flujo deben ser nodos distintos.")

    grafo_residual = defaultdict(lambda: defaultdict(float))


    for arista in aristas:
        u = arista['origen']
        v = arista['destino']
        capacidad = arista['capacidad']
        grafo_residual[u][v] += capacidad
        grafo_residual[v][u] += capacidad


    for nodo in nodos.keys():
        if nodo not in grafo_residual:
            grafo_residual[nodo] = defaultdict(float)

    padres = {}
    flujo_maximo = 0.0


    while bfs_camino(grafo_residual, origen, destino, padres):
        flujo_camino = float('Inf')
        s = destino


        while s != origen:
            flujo_camino = min(flujo_camino, grafo_residual[padres[s]][s])
            s = padres[s]

        flujo_maximo += flujo_camino
        v = destino
        camino = [destino]


        while v != origen:
            u = padres[v]
            grafo_residual[u][v] -= flujo_camino
            grafo_residual[v][u] += flujo_camino
            v = padres[v]
            camino.append(v)

        if caminos is not None and len(caminos) < MAXIMO_CAMINOS:
            caminos.append(camino[::-1])

    lineas_corte = obtener_corte_minimo(grafo_residual, aristas, origen)

    return flujo_maximo, lineas_corte
