from .merge_sort import ordenar_con_merge_sort
from .union_find import UnionFind


def optimizar_costos_kruskal(nodos, aristas, pasos=None):
    uf = UnionFind(nodos.keys())
    mst = []
    costo_total = 0

    aristas_ordenadas = ordenar_con_merge_sort(aristas, lambda x: x['costo'])

    for arista in aristas_ordenadas:
        origen = arista['origen']
        destino = arista['destino']
        aceptada = uf.buscar(origen) != uf.buscar(destino)

        if aceptada:
            uf.unir(origen, destino)
            mst.append(arista)
            costo_total += arista['costo']
        if pasos is not None:
            pasos.append([origen, destino, int(aceptada)])

    return mst, costo_total
