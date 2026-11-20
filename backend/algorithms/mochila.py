def resolver_mochila_dinamica(costos, valores, presupuesto):
    n = len(costos)
    tabla = [[0] * (presupuesto + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for capacidad in range(presupuesto + 1):
            tabla[i][capacidad] = tabla[i - 1][capacidad]
            if costos[i - 1] <= capacidad:
                con_item = tabla[i - 1][capacidad - costos[i - 1]] + valores[i - 1]
                tabla[i][capacidad] = max(tabla[i][capacidad], con_item)

    elegidos = []
    capacidad = presupuesto
    for i in range(n, 0, -1):
        if tabla[i][capacidad] != tabla[i - 1][capacidad]:
            elegidos.append(i - 1)
            capacidad -= costos[i - 1]

    return tabla[n][presupuesto], sorted(elegidos), tabla


def resolver_mochila_fuerza_bruta(costos, valores, presupuesto):
    n = len(costos)
    mejor_valor, mejor = 0, []
    for combinacion in range(1 << n):
        elegidos = [i for i in range(n) if combinacion >> i & 1]
        costo = sum(costos[i] for i in elegidos)
        valor = sum(valores[i] for i in elegidos)
        if costo <= presupuesto and valor > mejor_valor:
            mejor_valor, mejor = valor, elegidos
    return mejor_valor, mejor, 1 << n


def resolver_mochila_backtracking(costos, valores, presupuesto, pasos=None):
    n = len(costos)
    orden = sorted(range(n), key=lambda i: valores[i] / max(costos[i], 1), reverse=True)
    mejor = {"valor": 0, "elegidos": []}
    contador = {"explorados": 0, "podados": 0}

    def cota(posicion, costo, valor):
        for i in orden[posicion:]:
            if costo + costos[i] <= presupuesto:
                costo += costos[i]
                valor += valores[i]
            else:
                return valor + valores[i] * (presupuesto - costo) / max(costos[i], 1)
        return valor

    def explorar(posicion, costo, valor, elegidos):
        contador["explorados"] += 1
        if valor > mejor["valor"]:
            mejor["valor"], mejor["elegidos"] = valor, list(elegidos)
        if posicion == n:
            return
        if cota(posicion, costo, valor) <= mejor["valor"]:
            contador["podados"] += 1
            if pasos is not None:
                pasos.append([posicion, -1, valor])
            return
        item = orden[posicion]
        if costo + costos[item] <= presupuesto:
            elegidos.append(item)
            if pasos is not None:
                pasos.append([posicion, item, valor + valores[item]])
            explorar(posicion + 1, costo + costos[item], valor + valores[item], elegidos)
            elegidos.pop()
        explorar(posicion + 1, costo, valor, elegidos)

    explorar(0, 0, 0, [])
    return mejor["valor"], sorted(mejor["elegidos"]), contador
