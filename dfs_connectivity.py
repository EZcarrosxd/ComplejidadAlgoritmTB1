def encontrar_nodos_criticos(nodos, adyacencia):
    """
    Identifica subestaciones que, al fallar, desconectan secciones de la red.
    DFS iterativo (pila explícita) para no depender del límite de recursión de Python.
    """
    visitado = set()
    nodos_criticos = set()
    tiempo_descubrimiento = {}
    low = {}
    tiempo = 0

    for raiz in nodos.keys():
        if raiz in visitado:
            continue

        visitado.add(raiz)
        tiempo_descubrimiento[raiz] = low[raiz] = tiempo
        tiempo += 1
        hijos_raiz = 0

        # Cada elemento de la pila: (nodo, padre, iterador sobre sus conexiones)
        pila = [(raiz, None, iter(adyacencia.get(raiz, [])))]

        while pila:
            u, padre_u, conexiones = pila[-1]
            conexion = next(conexiones, None)

            if conexion is None:
                # Se terminó de explorar u: se propaga su low al padre
                pila.pop()
                if padre_u is not None:
                    low[padre_u] = min(low[padre_u], low[u])
                    # Condición para nodos no raíz
                    if padre_u != raiz and low[u] >= tiempo_descubrimiento[padre_u]:
                        nodos_criticos.add(padre_u)
                continue

            v = conexion['destino']

            if v not in visitado:
                visitado.add(v)
                tiempo_descubrimiento[v] = low[v] = tiempo
                tiempo += 1
                if u == raiz:
                    hijos_raiz += 1
                pila.append((v, u, iter(adyacencia.get(v, []))))

            elif v != padre_u:
                low[u] = min(low[u], tiempo_descubrimiento[v])

        # Condición de punto de articulación para nodo raíz
        if hijos_raiz > 1:
            nodos_criticos.add(raiz)

    return list(nodos_criticos)
