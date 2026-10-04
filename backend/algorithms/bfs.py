from collections import deque

def bfs_distancias(adyacencia, inicio):

    distancias = {inicio: 0}
    cola = deque([inicio])

    while cola:
        u = cola.popleft()
        for conexion in adyacencia.get(u, []):
            v = conexion['destino']
            if v not in distancias:
                distancias[v] = distancias[u] + 1
                cola.append(v)

    return distancias

def encontrar_nodos_mas_alejados(nodos, adyacencia):

    inicio = next(iter(nodos))

    distancias = bfs_distancias(adyacencia, inicio)
    extremo_a = max(distancias, key=distancias.get)

    distancias = bfs_distancias(adyacencia, extremo_a)
    extremo_b = max(distancias, key=distancias.get)

    return extremo_a, extremo_b
