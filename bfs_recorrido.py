from collections import deque

def bfs_distancias(adyacencia, inicio):
    """
    Recorre la red por niveles y retorna la cantidad de líneas (saltos)
    que separan a cada nodo alcanzable del nodo de inicio.
    """
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
    """
    Elige dos nodos en extremos opuestos de la red mediante doble barrido BFS:
    desde un nodo cualquiera se busca el más lejano (a) y desde a, el más lejano (b).
    Sirven como origen y destino por defecto del flujo máximo.
    """
    inicio = next(iter(nodos))

    distancias = bfs_distancias(adyacencia, inicio)
    extremo_a = max(distancias, key=distancias.get)

    distancias = bfs_distancias(adyacencia, extremo_a)
    extremo_b = max(distancias, key=distancias.get)

    return extremo_a, extremo_b
