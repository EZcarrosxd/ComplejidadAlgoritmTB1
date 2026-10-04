from .union_find import UnionFind


def optimizar_costos_kruskal(nodos, aristas):

    uf = UnionFind(nodos.keys())
    mst = []
    costo_total = 0.0


    aristas_ordenadas = sorted(aristas, key=lambda x: x['costo'])

    for arista in aristas_ordenadas:
        origen = arista['origen']
        destino = arista['destino']


        if uf.buscar(origen) != uf.buscar(destino):
            uf.unir(origen, destino)
            mst.append(arista)
            costo_total += arista['costo']

    return mst, costo_total
