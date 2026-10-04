from time import perf_counter

from backend.algorithms.articulacion import encontrar_nodos_criticos
from backend.algorithms.flujo import calcular_flujo_maximo
from backend.algorithms.kruskal import optimizar_costos_kruskal
from .fallas import medir_impacto, resumir_impacto, semillas_de_impacto
from .terminals import seleccionar_extremos
from .visualization import crear_subgrafo


class AnalizadorRed:


    def analizar(self, red, origen=None, destino=None):
        inicio = perf_counter()
        origen, destino, seleccion = seleccionar_extremos(red, origen, destino)
        mst, costo = optimizar_costos_kruskal(red.nodos, red.aristas)
        criticos = sorted(encontrar_nodos_criticos(red.nodos, red.adyacencia))
        caminos = []
        flujo, corte = calcular_flujo_maximo(red.nodos, red.aristas, origen, destino, caminos)
        componentes = len(red.nodos) - len(mst)
        impacto = medir_impacto(red, criticos)
        camino = caminos[0] if caminos else []
        semillas = [origen, destino, *camino, *semillas_de_impacto(impacto)]
        grafo = crear_subgrafo(red, criticos, semillas)
        visibles = {nodo["id"] for nodo in grafo["nodos"]}
        return {
            "costo_minimo_instalacion": round(costo, 2),
            "aristas_mst": mst,
            "flujo_maximo_red": flujo,
            "lineas_corte_minimo": corte,
            "caminos_flujo": caminos,
            "nodos_criticos": criticos,
            "impacto_criticos": resumir_impacto(impacto, visibles),
            "grafo_visual": grafo,
            "tiempo_ejecucion": round(perf_counter() - inicio, 6),
            "metadata": {
                "total_nodos": len(red.nodos),
                "total_aristas": len(red.aristas),
                "costo_total_red": round(sum(a["costo"] for a in red.aristas), 2),
                "origen_flujo": origen,
                "destino_flujo": destino,
                "seleccion_flujo": seleccion,
                "ids_nodos": list(red.nodos),
                "componentes": componentes,
                "red_conectada": componentes == 1,
                "unidad_capacidad": "A",
            },
        }
