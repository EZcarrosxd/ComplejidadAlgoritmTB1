# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from main import ControladorOrquestador

app = Flask(__name__)
# Habilitar CORS para permitir peticiones desde el futuro archivo HTML (Front-end)
CORS(app)

# Ruta estática del dataset
RUTA_DATASET = r"C:\Users\Carlos\Downloads\dataset.json"

# Se ejecuta la orquestación en el arranque del servidor para evitar procesar 
# los algoritmos de 1500 nodos repetidamente en cada petición HTTP.
try:
    print("Inicializando el controlador y procesando los algoritmos...")
    controlador = ControladorOrquestador(RUTA_DATASET)
    resultados = controlador.ejecutar_flujo_completo()
    print("Procesamiento completado. Servidor listo para recibir peticiones.")
except Exception as e:
    print(f"Error al inicializar los datos: {e}")
    resultados = {}

@app.route('/api/network-status', methods=['GET'])
def get_network_status():
    """
    Devuelve los nodos críticos identificados por el algoritmo DFS
    y la metadata general de la red eléctrica.
    """
    if not resultados:
        return jsonify({"error": "No se pudieron procesar los datos de la red"}), 500
        
    return jsonify({
        "nodos_criticos": resultados.get("nodos_criticos", []),
        "metadata": resultados.get("metadata", {}),
        "tiempo_ejecucion_total": resultados.get("tiempo_ejecucion", 0)
    })

@app.route('/api/optimization/mst', methods=['GET'])
def get_optimization_mst():
    """
    Devuelve el costo mínimo de instalación calculado por el algoritmo de Kruskal.
    """
    if not resultados:
        return jsonify({"error": "Datos no disponibles"}), 500
        
    return jsonify({
        "costo_minimo_instalacion": resultados.get("costo_minimo_instalacion", 0)
    })

@app.route('/api/optimization/flow', methods=['GET'])
def get_optimization_flow():
    """
    Devuelve la capacidad de flujo máximo calculada por el algoritmo de Ford-Fulkerson.
    """
    if not resultados:
        return jsonify({"error": "Datos no disponibles"}), 500
        
    return jsonify({
        "flujo_maximo_red": resultados.get("flujo_maximo_red", 0),
        "origen_evaluado": resultados.get("metadata", {}).get("origen_flujo", ""),
        "destino_evaluado": resultados.get("metadata", {}).get("destino_flujo", "")
    })

if __name__ == '__main__':
    # El servidor se ejecutará en http://localhost:5000 por defecto
    app.run(debug=True, port=5000)