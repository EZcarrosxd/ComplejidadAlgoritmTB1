from decimal import Decimal, ROUND_HALF_UP, localcontext
from time import perf_counter

from backend.algorithms.componentes import separar_componentes
from backend.algorithms.kruskal import optimizar_costos_kruskal
from backend.algorithms.prim import seleccionar_aristas_prim
from backend.schemas.geografica import MAXIMO_ENTERO_JSON


def ejecutar_kruskal(nodos, aristas):
    seleccionadas, peso = optimizar_costos_kruskal(nodos, aristas)
    return [arista["id"] for arista in seleccionadas], peso


def ejecutar_prim(nodos, aristas):
    seleccionadas, peso = seleccionar_aristas_prim(nodos, aristas, nodos)
    return [aristas[indice]["id"] for _, _, indice in seleccionadas], peso


def ejecutar_bfs(nodos, aristas):
    adyacencia = {nodo: [] for nodo in nodos}
    for arista in aristas:
        origen, destino = arista["origen"], arista["destino"]
        adyacencia[origen].append({"destino": destino})
        adyacencia[destino].append({"destino": origen})
    _, tamanos = separar_componentes(adyacencia)
    return {
        "conexo": len(tamanos) == 1,
        "componentes": len(tamanos),
        "mayor_componente": max(tamanos),
    }


def estimar_cableado(peso_mm, precio_por_metro):
    with localcontext() as contexto:
        contexto.prec = 40
        importe = precio_por_metro * peso_mm / 1000
        return str(importe.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def analizar_georreferenciado(algoritmo, grafo, precio_por_metro=None):
    nodos = dict.fromkeys(nodo.id for nodo in grafo.nodos)
    aristas = [
        {"id": arista.id, "origen": arista.origen, "destino": arista.destino, "costo": arista.peso_mm}
        for arista in grafo.aristas
    ]
    inicio = perf_counter()
    if algoritmo == "bfs":
        resultado = ejecutar_bfs(nodos, aristas)
    else:
        seleccionar = ejecutar_kruskal if algoritmo == "kruskal" else ejecutar_prim
        seleccionadas, peso = seleccionar(nodos, aristas)
        resultado = {
            "aristas_seleccionadas": seleccionadas,
            "cantidad": len(seleccionadas),
            "peso_total_mm": peso if peso <= MAXIMO_ENTERO_JSON else str(peso),
            "componentes": len(nodos) - len(seleccionadas),
        }
        if precio_por_metro is not None:
            resultado["costo_estimado"] = estimar_cableado(peso, precio_por_metro)
    return {
        "algoritmo": algoritmo,
        "nodos": len(nodos),
        "aristas": len(aristas),
        "segundos": round(perf_counter() - inicio, 3),
        **resultado,
    }
