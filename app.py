# app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
from main import ControladorOrquestador

app = Flask(__name__)
CORS(app)

# Carpeta temporal para guardar el dataset subido
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Estado global para mantener los resultados si se usan los métodos GET tradicionales
resultados_globales = {}

@app.route('/api/upload', methods=['POST'])
def upload_dataset():
    global resultados_globales
    
    if 'file' not in request.files:
        return jsonify({"error": "No se encontró ningún archivo en la petición"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400
        
    if file and (file.filename.endswith('.json') or file.filename.endswith('.csv')):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Origen y destino del flujo son opcionales; si faltan se eligen automáticamente
        origen = request.form.get('origen', '').strip() or None
        destino = request.form.get('destino', '').strip() or None

        try:
            # Ejecutamos el flujo matemático con el archivo recién subido
            controlador = ControladorOrquestador(filepath)
            resultados_globales = controlador.ejecutar_flujo_completo(origen, destino)

            # Devolvemos todos los resultados consolidados para ahorrar ancho de banda y latencia
            return jsonify({
                "mensaje": "Red procesada con éxito",
                "datos": resultados_globales
            }), 200
        except ValueError as e:
            # Origen o destino del flujo inválidos
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": f"Error al procesar los algoritmos: {str(e)}"}), 500
        finally:
            # Eliminamos el archivo temporal tras el cálculo para no saturar el disco
            os.remove(filepath)
    else:
        return jsonify({"error": "Formato de archivo no soportado. Use .json o .csv"}), 400

# Se mantienen los endpoints GET por compatibilidad arquitectónica
@app.route('/api/network-status', methods=['GET'])
def get_network_status():
    if not resultados_globales:
        return jsonify({"error": "Datos no disponibles"}), 500
    return jsonify({
        "nodos_criticos": resultados_globales.get("nodos_criticos", []),
        "metadata": resultados_globales.get("metadata", {})
    })

@app.route('/api/optimization/mst', methods=['GET'])
def get_optimization_mst():
    if not resultados_globales:
        return jsonify({"error": "Datos no disponibles"}), 500
    return jsonify({"costo_minimo_instalacion": resultados_globales.get("costo_minimo_instalacion", 0)})

@app.route('/api/optimization/flow', methods=['GET'])
def get_optimization_flow():
    if not resultados_globales:
        return jsonify({"error": "Datos no disponibles"}), 500
    return jsonify({
        "flujo_maximo_red": resultados_globales.get("flujo_maximo_red", 0),
        "lineas_corte_minimo": resultados_globales.get("lineas_corte_minimo", []),
        "origen_evaluado": resultados_globales.get("metadata", {}).get("origen_flujo", ""),
        "destino_evaluado": resultados_globales.get("metadata", {}).get("destino_flujo", "")
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)