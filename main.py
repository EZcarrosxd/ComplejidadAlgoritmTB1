# main.py
import time
from data_loader import cargar_nodos, cargar_aristas
from graph_model import RedElectrica
from kruskal_mst import optimizar_costos_kruskal
from ford_fulkerson import calcular_flujo_maximo
from dfs_connectivity import encontrar_nodos_criticos

def main():
    print("--- 1. CARGA DE DATOS ---")
    nodos = cargar_nodos('dataset_nodos.csv')
    aristas = cargar_aristas('dataset_aristas.csv')
    
    red = RedElectrica()
    red.inicializar_red(nodos, aristas)
    print(f"Total de nodos cargados: {red.obtener_cantidad_nodos()}")

    print("\n--- 2. OPTIMIZACIÓN DE COSTOS (KRUSKAL) ---")
    mst, costo_minimo = optimizar_costos_kruskal(nodos, aristas)
    print(f"Costo mínimo de instalación (MST): {costo_minimo}")
    print(f"Líneas de transmisión seleccionadas: {len(mst)}")

    print("\n--- 3. ROBUSTEZ Y NODOS CRÍTICOS (DFS) ---")
    criticos = encontrar_nodos_criticos(nodos, red.adyacencia)
    print(f"Subestaciones críticas detectadas: {len(criticos)}")

    # Prueba de flujo entre los dos primeros nodos disponibles
    if len(nodos) >= 2:
        lista_claves = list(nodos.keys())
        origen = lista_claves[0]
        destino = lista_claves[1]
        
        print(f"\n--- 4. FLUJO MÁXIMO (FORD-FULKERSON) ---")
        print(f"Calculando capacidad de flujo entre {origen} y {destino}...")
        flujo = calcular_flujo_maximo(nodos, aristas, origen, destino)
        print(f"Capacidad máxima de transmisión: {flujo}")

if __name__ == '__main__':
    main()