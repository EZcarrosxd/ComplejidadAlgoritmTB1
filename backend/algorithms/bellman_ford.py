INFINITO = float('inf')


def calcular_rutas_bellman_ford(nodos, aristas, origen, pasos=None):
    distancia = {nodo: INFINITO for nodo in nodos}
    padre = {nodo: None for nodo in nodos}
    distancia[origen] = 0.0
    dirigidas = [(a['origen'], a['destino'], a['costo']) for a in aristas]
    dirigidas += [(v, u, costo) for u, v, costo in dirigidas]
    iteraciones = 0

    for iteracion in range(1, len(nodos)):
        hubo_cambio = False
        for u, v, costo in dirigidas:
            if distancia[u] + costo < distancia[v]:
                distancia[v] = distancia[u] + costo
                padre[v] = u
                hubo_cambio = True
                if pasos is not None:
                    pasos.append([iteracion, u, v])
        iteraciones = iteracion
        if not hubo_cambio:
            break

    for u, v, costo in dirigidas:
        if distancia[u] + costo < distancia[v]:
            raise ValueError("La red tiene un ciclo de costo negativo")

    return distancia, padre, iteraciones


def reconstruir_camino(padre, destino):
    camino = []
    actual = destino
    while actual is not None:
        camino.append(actual)
        actual = padre[actual]
    return camino[::-1]
