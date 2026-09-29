class UnionFind:
    def __init__(self, vertices):
        self.padre = {v: v for v in vertices}
        self.rango = {v: 0 for v in vertices}

    def buscar(self, item):
        if self.padre[item] == item:
            return item
        self.padre[item] = self.buscar(self.padre[item])
        return self.padre[item]

    def unir(self, x, y):
        raiz_x = self.buscar(x)
        raiz_y = self.buscar(y)
        
        if raiz_x != raiz_y:
            if self.rango[raiz_x] < self.rango[raiz_y]:
                self.padre[raiz_x] = raiz_y
            elif self.rango[raiz_x] > self.rango[raiz_y]:
                self.padre[raiz_y] = raiz_x
            else:
                self.padre[raiz_y] = raiz_x
                self.rango[raiz_x] += 1

def optimizar_costos_kruskal(nodos, aristas):
    """
    Retorna las aristas que conforman el MST y el costo total de instalación.
    """
    uf = UnionFind(nodos.keys())
    mst = []
    costo_total = 0.0

    # Ordenar todas las aristas de menor a mayor costo
    aristas_ordenadas = sorted(aristas, key=lambda x: x['costo'])

    for arista in aristas_ordenadas:
        origen = arista['origen']
        destino = arista['destino']
        
        # Si no forman un ciclo, se incluye la arista en el MST
        if uf.buscar(origen) != uf.buscar(destino):
            uf.unir(origen, destino)
            mst.append(arista)
            costo_total += arista['costo']

    return mst, costo_total