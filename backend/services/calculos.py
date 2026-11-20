from backend.algorithms.articulacion import encontrar_nodos_criticos
from backend.algorithms.bellman_ford import calcular_rutas_bellman_ford, reconstruir_camino
from backend.algorithms.bfs import bfs_distancias
from backend.algorithms.floyd_warshall import calcular_distancias_floyd_warshall
from backend.algorithms.kruskal import optimizar_costos_kruskal
from backend.algorithms.merge_sort import ordenar_con_merge_sort
from backend.algorithms.mochila import (
    resolver_mochila_backtracking,
    resolver_mochila_dinamica,
    resolver_mochila_fuerza_bruta,
)
from backend.algorithms.prim import optimizar_costos_prim
from backend.algorithms.union_find import UnionFind

LIMITE_PASOS = 4000
NODOS_ZONA = 24
PROPORCION_PRESUPUESTO = 0.4
MAXIMO_FUERZA_BRUTA = 20
COLUMNAS_TABLA = 48


def recortar(pasos):
    if len(pasos) <= LIMITE_PASOS:
        return pasos
    salto = len(pasos) / LIMITE_PASOS
    return [pasos[int(i * salto)] for i in range(LIMITE_PASOS)]


def calcular_bfs(red, origen):
    distancias = bfs_distancias(red.adyacencia, origen)
    return {
        "origen": origen,
        "pasos": [[nodo, nivel] for nodo, nivel in distancias.items()],
        "alcance": len(distancias),
        "nivel_maximo": max(distancias.values()),
    }


def calcular_dfs(red, criticos):
    orden = []
    encontrar_nodos_criticos(red.nodos, red.adyacencia, orden)
    return {"pasos": orden, "criticos": criticos}


def calcular_union_find(red):
    uf = UnionFind(red.nodos.keys())
    componentes = len(red.nodos)
    pasos = []
    for arista in red.aristas:
        une = uf.buscar(arista["origen"]) != uf.buscar(arista["destino"])
        if une:
            uf.unir(arista["origen"], arista["destino"])
            componentes -= 1
        pasos.append([arista["origen"], arista["destino"], int(une)])
    return {"pasos": pasos, "componentes": componentes}


def calcular_kruskal(red):
    pasos = []
    _, costo = optimizar_costos_kruskal(red.nodos, red.aristas, pasos)
    return {"pasos": pasos, "costo": round(costo, 2)}


def calcular_prim(red, inicio):
    arbol, costo = optimizar_costos_prim(red.nodos, red.aristas, inicio)
    return {"inicio": inicio, "pasos": arbol, "costo": round(costo, 2)}


def calcular_merge_sort(red):
    costos = [round(arista["costo"], 2) for arista in red.aristas]
    mezclas = []
    ordenar_con_merge_sort(costos, lambda x: x, mezclas)
    return {"costos": costos, "pasos": mezclas}


def calcular_bellman_ford(red, origen, destino):
    pasos = []
    distancia, padre, iteraciones = calcular_rutas_bellman_ford(red.nodos, red.aristas, origen, pasos)
    return {
        "origen": origen,
        "destino": destino,
        "camino": reconstruir_camino(padre, destino),
        "costo": round(distancia[destino], 2),
        "iteraciones": iteraciones,
        "relajaciones": len(pasos),
        "pasos": recortar(pasos),
    }


def elegir_zona(red, origen):
    return list(bfs_distancias(red.adyacencia, origen))[:NODOS_ZONA]


def calcular_floyd_warshall(red, origen):
    zona = elegir_zona(red, origen)
    dentro = set(zona)
    aristas = [a for a in red.aristas if a["origen"] in dentro and a["destino"] in dentro]
    pasos = []
    matriz = calcular_distancias_floyd_warshall(zona, aristas, pasos)
    return {
        "nodos": zona,
        "aristas": [[a["origen"], a["destino"]] for a in aristas],
        "matriz": [[None if d == float("inf") else round(d, 2) for d in fila] for fila in matriz],
        "pasos": pasos,
    }


def crear_items_refuerzo(red, impacto):
    costo_lineas = {}
    for arista in red.aristas:
        for extremo in (arista["origen"], arista["destino"]):
            costo_lineas[extremo] = costo_lineas.get(extremo, 0) + arista["costo"]
    return [
        {"id": x["id"], "costo": max(1, round(costo_lineas.get(x["id"], 0))), "valor": len(x["aislados"])}
        for x in impacto
    ]


def muestrear_tabla(tabla, presupuesto):
    columnas = [round(presupuesto * j / (COLUMNAS_TABLA - 1)) for j in range(COLUMNAS_TABLA)]
    return [[fila[c] for c in columnas] for fila in tabla]


def calcular_refuerzo(red, impacto):
    items = crear_items_refuerzo(red, impacto)
    costos = [item["costo"] for item in items]
    valores = [item["valor"] for item in items]
    presupuesto = int(sum(costos) * PROPORCION_PRESUPUESTO)
    ids = [item["id"] for item in items]

    valor, elegidos, tabla = resolver_mochila_dinamica(costos, valores, presupuesto)
    mochila = {
        "presupuesto": presupuesto,
        "items": items,
        "elegidos": [ids[i] for i in elegidos],
        "valor": valor,
        "costo": sum(costos[i] for i in elegidos),
        "tabla": muestrear_tabla(tabla, presupuesto),
    }

    pasos = []
    valor_bt, elegidos_bt, contador = resolver_mochila_backtracking(costos, valores, presupuesto, pasos)
    combinaciones = None
    if len(items) <= MAXIMO_FUERZA_BRUTA:
        _, _, combinaciones = resolver_mochila_fuerza_bruta(costos, valores, presupuesto)
    backtracking = {
        "presupuesto": presupuesto,
        "elegidos": [ids[i] for i in elegidos_bt],
        "valor": valor_bt,
        "explorados": contador["explorados"],
        "podados": contador["podados"],
        "combinaciones": combinaciones,
        "pasos": [[posicion, ids[item] if item >= 0 else None, acumulado] for posicion, item, acumulado in recortar(pasos)],
    }
    return mochila, backtracking


def calcular_algoritmos(red, capacidad, criticos, impacto):
    origen, destino = capacidad.origen, capacidad.destino
    mochila, backtracking = calcular_refuerzo(red, impacto)
    return {
        "bfs": calcular_bfs(red, origen),
        "dfs": calcular_dfs(red, criticos),
        "union_find": calcular_union_find(red),
        "kruskal": calcular_kruskal(red),
        "prim": calcular_prim(red, origen),
        "merge_sort": calcular_merge_sort(red),
        "bellman_ford": calcular_bellman_ford(red, origen, destino),
        "floyd_warshall": calcular_floyd_warshall(red, origen),
        "mochila": mochila,
        "backtracking": backtracking,
    }
