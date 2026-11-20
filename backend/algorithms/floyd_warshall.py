INFINITO = float('inf')


def calcular_distancias_floyd_warshall(nodos, aristas, pasos=None):
    indice = {nodo: i for i, nodo in enumerate(nodos)}
    n = len(nodos)
    distancia = [[0.0 if i == j else INFINITO for j in range(n)] for i in range(n)]

    for arista in aristas:
        i, j = indice[arista['origen']], indice[arista['destino']]
        distancia[i][j] = min(distancia[i][j], arista['costo'])
        distancia[j][i] = distancia[i][j]

    for k in range(n):
        mejoras = 0
        for i in range(n):
            for j in range(n):
                if distancia[i][k] + distancia[k][j] < distancia[i][j]:
                    distancia[i][j] = distancia[i][k] + distancia[k][j]
                    mejoras += 1
        if pasos is not None:
            pasos.append([nodos[k], mejoras])

    return distancia
