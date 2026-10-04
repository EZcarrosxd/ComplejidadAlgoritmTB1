from collections import defaultdict, deque

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

def calcular_flujo_maximo(nodos, aristas, origen, destino):
    """
    Calcula el flujo máximo de energía que puede soportar la red.
    """
    if origen not in nodos or destino not in nodos:
        raise ValueError(f"El origen ({origen}) y el destino ({destino}) deben existir en la red.")
    if origen == destino:
        raise ValueError("El origen y el destino del flujo deben ser nodos distintos.")

    grafo_residual = defaultdict(lambda: defaultdict(float))

    # Construcción del grafo residual inicial: una línea eléctrica puede
    # transportar energía en ambos sentidos, así que se registra u -> v y v -> u
    for arista in aristas:
        u = arista['origen']
        v = arista['destino']
        capacidad = arista['capacidad']
        grafo_residual[u][v] += capacidad
        grafo_residual[v][u] += capacidad

    # Asegurar la existencia de todos los nodos
    for nodo in nodos.keys():
        if nodo not in grafo_residual:
            grafo_residual[nodo] = defaultdict(float)

    padres = {}
    flujo_maximo = 0.0

    # Búsqueda de caminos aumentantes
    while bfs_camino(grafo_residual, origen, destino, padres):
        flujo_camino = float('Inf')
        s = destino
        
        # Encontrar la capacidad mínima en el camino hallado
        while s != origen:
            flujo_camino = min(flujo_camino, grafo_residual[padres[s]][s])
            s = padres[s]

        flujo_maximo += flujo_camino
        v = destino
        
        # Actualizar las capacidades residuales
        while v != origen:
            u = padres[v]
            grafo_residual[u][v] -= flujo_camino
            grafo_residual[v][u] += flujo_camino
            v = padres[v]

    lineas_corte = obtener_corte_minimo(grafo_residual, aristas, origen)

    return flujo_maximo, lineas_corte

def obtener_corte_minimo(grafo_residual, aristas, origen):
    """
    Con el flujo máximo ya calculado, los nodos alcanzables desde el origen en el
    grafo residual forman un lado del corte. Las líneas que cruzan al otro lado son
    el corte mínimo: el menor conjunto de líneas cuya falla aísla el destino.
    """
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