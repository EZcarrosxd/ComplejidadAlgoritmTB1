import heapq


def crear_adyacencia_con_costos(nodos, aristas):
    adyacencia = {nodo: [] for nodo in nodos}
    for indice, arista in enumerate(aristas):
        origen, destino, costo = arista["origen"], arista["destino"], arista["costo"]
        adyacencia[origen].append((costo, origen, destino, indice))
        adyacencia[destino].append((costo, destino, origen, indice))
    return adyacencia


def seleccionar_aristas_prim(nodos, aristas, inicios):
    adyacencia = crear_adyacencia_con_costos(nodos, aristas)
    visitados = set()
    seleccionadas = []
    costo_total = 0

    for inicio in inicios:
        if inicio in visitados:
            continue
        visitados.add(inicio)
        frontera = list(adyacencia[inicio])
        heapq.heapify(frontera)
        while frontera:
            costo, desde, hacia, indice = heapq.heappop(frontera)
            if hacia in visitados:
                continue
            visitados.add(hacia)
            seleccionadas.append((desde, hacia, indice))
            costo_total += costo
            for conexion in adyacencia[hacia]:
                if conexion[2] not in visitados:
                    heapq.heappush(frontera, conexion)
    return seleccionadas, costo_total

def optimizar_costos_prim(nodos, aristas, inicio):
    seleccionadas, costo_total = seleccionar_aristas_prim(nodos, aristas, [inicio])
    return [[desde, hacia] for desde, hacia, _ in seleccionadas], costo_total
