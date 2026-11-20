from time import perf_counter

from .capacidad import analizar_capacidad
from .costo import analizar_costo
from .fallas import analizar_fallas, resumir_impacto, semillas_de_impacto
from .visualizacion import crear_subgrafo


class AnalizadorRed:
    def analizar(self, red, origen=None, destino=None):
        inicio = perf_counter()
        capacidad = analizar_capacidad(red, origen, destino)
        costo = analizar_costo(red)
        criticos, impacto = analizar_fallas(red)
        camino = capacidad.caminos[0] if capacidad.caminos else []
        semillas = [capacidad.origen, capacidad.destino, *camino, *semillas_de_impacto(impacto)]
        grafo = crear_subgrafo(red, criticos, semillas)
        visibles = {nodo["id"] for nodo in grafo["nodos"]}
        return {
            "costo_minimo_instalacion": costo.costo_minimo,
            "aristas_mst": costo.aristas_mst,
            "flujo_maximo_red": capacidad.flujo_maximo,
            "lineas_corte_minimo": capacidad.corte_minimo,
            "caminos_flujo": capacidad.caminos,
            "nodos_criticos": criticos,
            "impacto_criticos": resumir_impacto(impacto, visibles),
            "grafo_visual": grafo,
            "tiempo_ejecucion": round(perf_counter() - inicio, 6),
            "metadata": {
                "total_nodos": len(red.nodos),
                "total_aristas": len(red.aristas),
                "costo_total_red": costo.costo_total,
                "origen_flujo": capacidad.origen,
                "destino_flujo": capacidad.destino,
                "seleccion_flujo": capacidad.seleccion,
                "ids_nodos": list(red.nodos),
                "componentes": costo.componentes,
                "red_conectada": costo.componentes == 1,
                "unidad_capacidad": "A",
            },
        }
