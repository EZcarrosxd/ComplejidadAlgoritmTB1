from time import perf_counter

from backend.algorithms.articulacion import encontrar_nodos_criticos
from backend.algorithms.flujo import calcular_flujo_maximo
from backend.algorithms.kruskal import optimizar_costos_kruskal
from .terminals import seleccionar_extremos
from .visualization import crear_subgrafo


class AnalizadorRed:


    def analizar(self, red, origen=None, destino=None):
        inicio = perf_counter()
        origen, destino, seleccion = seleccionar_extremos(red, origen, destino)
        mst, costo = optimizar_costos_kruskal(red.nodos, red.aristas)
        criticos = sorted(encontrar_nodos_criticos(red.nodos, red.adyacencia))
        flujo, corte = calcular_flujo_maximo(red.nodos, red.aristas, origen, destino)
        componentes = len(red.nodos) - len(mst)
        return {
            "costo_minimo_instalacion": round(costo, 2),
            "aristas_mst": mst,
            "flujo_maximo_red": flujo,
            "lineas_corte_minimo": corte,
            "nodos_criticos": criticos,
            "grafo_visual": crear_subgrafo(red, criticos),
            "tiempo_ejecucion": round(perf_counter() - inicio, 6),
            "metadata": {
                "total_nodos": len(red.nodos),
                "total_aristas": len(red.aristas),
                "origen_flujo": origen,
                "destino_flujo": destino,
                "seleccion_flujo": seleccion,
                "ids_nodos": list(red.nodos),
                "componentes": componentes,
                "red_conectada": componentes == 1,
                "unidad_capacidad": "A",
            },
        }
