def ordenar_con_merge_sort(elementos, clave, mezclas=None):
    ordenados = list(elementos)
    auxiliar = list(elementos)

    def ordenar(inicio, fin):
        if fin - inicio <= 1:
            return
        medio = (inicio + fin) // 2
        ordenar(inicio, medio)
        ordenar(medio, fin)
        mezclar(inicio, medio, fin)

    def mezclar(inicio, medio, fin):
        izquierda, derecha, k = inicio, medio, inicio
        while izquierda < medio and derecha < fin:
            if clave(ordenados[izquierda]) <= clave(ordenados[derecha]):
                auxiliar[k] = ordenados[izquierda]
                izquierda += 1
            else:
                auxiliar[k] = ordenados[derecha]
                derecha += 1
            k += 1
        auxiliar[k:fin] = ordenados[izquierda:medio] + ordenados[derecha:fin]
        ordenados[inicio:fin] = auxiliar[inicio:fin]
        if mezclas is not None:
            mezclas.append([inicio, medio, fin])

    ordenar(0, len(ordenados))
    return ordenados
