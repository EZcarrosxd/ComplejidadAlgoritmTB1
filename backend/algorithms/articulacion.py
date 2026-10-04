def encontrar_nodos_criticos(nodos, adyacencia):

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


        pila = [(raiz, None, iter(adyacencia.get(raiz, [])))]

        while pila:
            u, padre_u, conexiones = pila[-1]
            conexion = next(conexiones, None)

            if conexion is None:

                pila.pop()
                if padre_u is not None:
                    low[padre_u] = min(low[padre_u], low[u])

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


        if hijos_raiz > 1:
            nodos_criticos.add(raiz)

    return list(nodos_criticos)
