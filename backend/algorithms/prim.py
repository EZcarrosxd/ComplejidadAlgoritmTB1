import heapq


def crear_adyacencia_con_costos(nodos, aristas):
    adyacencia = {nodo: [] for nodo in nodos}
    for arista in aristas:
        adyacencia[arista['origen']].append((arista['costo'], arista['destino']))
        adyacencia[arista['destino']].append((arista['costo'], arista['origen']))
    return adyacencia


def optimizar_costos_prim(nodos, aristas, inicio):
    adyacencia = crear_adyacencia_con_costos(nodos, aristas)
    en_arbol = {inicio}
    frontera = [(costo, inicio, vecino) for costo, vecino in adyacencia[inicio]]
    heapq.heapify(frontera)
    arbol = []
    costo_total = 0.0

    while frontera and len(en_arbol) < len(nodos):
        costo, desde, hacia = heapq.heappop(frontera)
        if hacia in en_arbol:
            continue
        en_arbol.add(hacia)
        arbol.append([desde, hacia])
        costo_total += costo
        for costo_vecino, vecino in adyacencia[hacia]:
            if vecino not in en_arbol:
                heapq.heappush(frontera, (costo_vecino, hacia, vecino))

    return arbol, costo_total
