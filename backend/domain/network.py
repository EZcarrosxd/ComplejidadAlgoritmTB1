class RedElectrica:


    def __init__(self, nodos, aristas):
        self.nodos = nodos
        self.aristas = aristas
        self.adyacencia = {nodo: [] for nodo in nodos}
        for arista in aristas:
            origen = arista["origen"]
            destino = arista["destino"]
            self.adyacencia[origen].append({"destino": destino})
            self.adyacencia[destino].append({"destino": origen})
