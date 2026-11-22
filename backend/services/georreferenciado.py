from time import perf_counter

from backend.algorithms.componentes import separar_componentes
from backend.algorithms.kruskal import optimizar_costos_kruskal
from backend.algorithms.prim import optimizar_costos_prim

MAXIMO_NODOS = 50_000
MAXIMO_ARISTAS = 500_000


def preparar_grafo(nodos, aristas):
    if not nodos or len(nodos) > MAXIMO_NODOS:
        raise ValueError("La red debe tener entre 1 y 50 000 estructuras")
    if len(set(nodos)) != len(nodos):
        raise ValueError("Hay identificadores de estructura repetidos")
    if len(aristas) > MAXIMO_ARISTAS:
        raise ValueError("La red supera las 500 000 aristas")

    lista = []
    pares = set()
    for indice, (origen, destino, peso_mm) in enumerate(aristas):
        if not (0 <= origen < len(nodos) and 0 <= destino < len(nodos)) or origen == destino:
            raise ValueError(f"La arista {indice} tiene extremos inválidos")
        if peso_mm <= 0:
            raise ValueError(f"La arista {indice} debe tener una longitud positiva en milímetros")
        par = frozenset((origen, destino))
        if par in pares:
            raise ValueError(f"La arista {indice} repite un par de estructuras")
        pares.add(par)
        lista.append({"indice": indice, "origen": nodos[origen], "destino": nodos[destino], "costo": peso_mm})
    return lista


def resumir_arbol(indices, peso_total, inicio):
    return {
        "aristas_seleccionadas": indices,
        "cantidad": len(indices),
        "peso_total_mm": int(peso_total),
        "segundos": round(perf_counter() - inicio, 3),
    }


def ejecutar_kruskal(nodos, aristas):
    inicio = perf_counter()
    arbol, peso_total = optimizar_costos_kruskal(dict.fromkeys(nodos), aristas)
    return resumir_arbol([arista["indice"] for arista in arbol], peso_total, inicio)


def ejecutar_prim(nodos, aristas):
    inicio = perf_counter()
    indice_por_par = {frozenset((a["origen"], a["destino"])): a["indice"] for a in aristas}
    arbol, peso_total = optimizar_costos_prim(dict.fromkeys(nodos), aristas, min(nodos))
    indices = [indice_por_par[frozenset(par)] for par in arbol]
    resultado = resumir_arbol(indices, peso_total, inicio)
    resultado["nodo_inicial"] = min(nodos)
    return resultado


def ejecutar_bfs(nodos, aristas):
    inicio = perf_counter()
    adyacencia = {nodo: [] for nodo in nodos}
    for arista in aristas:
        adyacencia[arista["origen"]].append({"destino": arista["destino"]})
        adyacencia[arista["destino"]].append({"destino": arista["origen"]})
    _, tamanos = separar_componentes(adyacencia)
    return {
        "conexo": len(tamanos) == 1,
        "componentes": len(tamanos),
        "mayor_componente": max(tamanos),
        "segundos": round(perf_counter() - inicio, 3),
    }


ALGORITMOS = {"kruskal": ejecutar_kruskal, "prim": ejecutar_prim, "bfs": ejecutar_bfs}


def analizar_georreferenciado(algoritmo, nodos, aristas):
    lista = preparar_grafo(nodos, aristas)
    resultado = ALGORITMOS[algoritmo](nodos, lista)
    return {"algoritmo": algoritmo, "nodos": len(nodos), "aristas": len(lista), **resultado}
