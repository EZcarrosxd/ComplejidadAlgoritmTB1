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
