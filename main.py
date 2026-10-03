# main.py
import time
import json
from data_loader import cargar_nodos, cargar_aristas
from graph_model import RedElectrica
from kruskal_mst import optimizar_costos_kruskal
from ford_fulkerson import calcular_flujo_maximo
from dfs_connectivity import encontrar_nodos_criticos

class ControladorOrquestador:
    def __init__(self, ruta_dataset):
        self.ruta_dataset = ruta_dataset
        self.nodos = None
        self.aristas = None
        self.red = RedElectrica()

    def ejecutar_flujo_completo(self):
        """
        Ejecuta secuencialmente la carga, modelado y algoritmos matemáticos.
        Retorna el payload estructurado cumpliendo el Contrato de Datos (Fase 4.2).
        """
        inicio_tiempo = time.time()
        
        self.nodos = cargar_nodos(self.ruta_dataset)
        self.aristas = cargar_aristas(self.ruta_dataset)
        
        self.red.inicializar_red(self.nodos, self.aristas)
        
        mst, costo_minimo = optimizar_costos_kruskal(self.nodos, self.aristas)
        criticos = encontrar_nodos_criticos(self.nodos, self.red.adyacencia)
        
        lista_claves = list(self.nodos.keys())
        origen = "N-1" if "N-1" in lista_claves else lista_claves[0]
        destino = lista_claves[-1]
        flujo = calcular_flujo_maximo(self.nodos, self.aristas, origen, destino)
        

        nodos_visuales = []
        aristas_visuales = []
        
        lista_nodos_limitada = lista_claves[:100]
        for nodo_id in lista_nodos_limitada:
            color = "#dc2626" if nodo_id in criticos else "#3b82f6"
            nodos_visuales.append({"id": nodo_id, "label": str(nodo_id), "color": color})
            
        for arista in self.aristas:
            if arista['origen'] in lista_nodos_limitada and arista['destino'] in lista_nodos_limitada:
                aristas_visuales.append({"from": arista['origen'], "to": arista['destino']})

        tiempo_total = time.time() - inicio_tiempo

        payload = {
            "costo_minimo_instalacion": round(costo_minimo, 2),
            "flujo_maximo_red": flujo,
            "nodos_criticos": criticos,
            "tiempo_ejecucion": round(tiempo_total, 4),
            "grafo_visual": {
                "nodos": nodos_visuales,
                "aristas": aristas_visuales
            },
            "metadata": {
                "total_nodos": self.red.obtener_cantidad_nodos(),
                "total_aristas": len(self.aristas),
                "origen_flujo": origen,
                "destino_flujo": destino
            }
        }
        
        return payload

# Validación de Resultados Aislados 
if __name__ == '__main__':
    # IMPORTANTE: Reemplace esto con su ruta local exacta
    ruta = r"C:\Users\Carlos\Downloads\dataset.json"
    
    controlador = ControladorOrquestador(ruta)
    try:
        resultados = controlador.ejecutar_flujo_completo()
        
        print("--- CONTRATO DE DATOS (JSON PAYLOAD) ---")
        # Generación del formato universal (JSON) exigido por el contrato
        json_salida = json.dumps(resultados, indent=4, ensure_ascii=False)
        print(json_salida)
        
    except Exception as e:
        print(f"La ejecución se detuvo por un error: {e}")