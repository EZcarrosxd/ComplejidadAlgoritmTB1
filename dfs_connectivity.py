def encontrar_nodos_criticos(nodos, adyacencia):
    """
    Identifica subestaciones que, al fallar, desconectan secciones de la red.
    """
    visitado = set()
    nodos_criticos = set()
    tiempo_descubrimiento = {}
    low = {}
    padre = {}
    tiempo = [0]

    def dfs(u):
        visitado.add(u)
        tiempo_descubrimiento[u] = tiempo[0]
        low[u] = tiempo[0]
        tiempo[0] += 1
        hijos = 0

        for conexion in adyacencia.get(u, []):
            v = conexion['destino']
            
            if v not in visitado:
                padre[v] = u
                hijos += 1
                dfs(v)
                low[u] = min(low[u], low[v])

                # Condición de punto de articulación para nodo raíz
                if padre.get(u) is None and hijos > 1:
                    nodos_criticos.add(u)
                # Condición para nodos no raíz
                if padre.get(u) is not None and low[v] >= tiempo_descubrimiento[u]:
                    nodos_criticos.add(u)
                    
            elif v != padre.get(u):
                low[u] = min(low[u], tiempo_descubrimiento[v])

    for nodo in nodos.keys():
        if nodo not in visitado:
            dfs(nodo)

    return list(nodos_criticos)