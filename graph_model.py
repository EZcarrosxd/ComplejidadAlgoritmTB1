class RedElectrica:
    def __init__(self):
        self.nodos = {}
        self.adyacencia = {}

    def inicializar_red(self, diccionario_nodos, lista_aristas):
        """
        Construye el grafo a partir de los datos previamente ingeridos.
        """
        # Registrar los nodos en el grafo
        for id_nodo, datos in diccionario_nodos.items():
            self.nodos[id_nodo] = datos
            self.adyacencia[id_nodo] = []

        # Construir las conexiones (listas de adyacencia)
        for arista in lista_aristas:
            origen = arista['origen']
            destino = arista['destino']
            capacidad = arista['capacidad']
            costo = arista['costo']

            # Se valida que ambos nodos existan antes de conectarlos
            if origen in self.adyacencia and destino in self.adyacencia:
                self.adyacencia[origen].append({
                    'destino': destino,
                    'capacidad': capacidad,
                    'costo': costo
                })
                # Nota: Si la red eléctrica permite flujo en ambas direcciones 
                # con el mismo costo y capacidad, se debe replicar la conexión hacia el origen:
                # self.adyacencia[destino].append({'destino': origen, 'capacidad': capacidad, 'costo': costo})

    def obtener_cantidad_nodos(self):
        return len(self.nodos)