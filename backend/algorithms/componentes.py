from collections import deque


def separar_componentes(adyacencia, excluido=None):

    componente = {}
    tamanos = []

    for inicio in adyacencia:
        if inicio == excluido or inicio in componente:
            continue

        indice = len(tamanos)
        componente[inicio] = indice
        cola = deque([inicio])
        tamano = 0

        while cola:
            u = cola.popleft()
            tamano += 1
            for conexion in adyacencia[u]:
                v = conexion['destino']
                if v != excluido and v not in componente:
                    componente[v] = indice
                    cola.append(v)

        tamanos.append(tamano)

    return componente, tamanos
