import csv
import json

def cargar_nodos(archivo):
    """
    Extrae las subestaciones eléctricas desde un archivo CSV o JSON.
    """
    nodos = {}
    try:
        if archivo.endswith('.json'):
            with open(archivo, mode='r', encoding='utf-8') as f:
                datos = json.load(f)
                
                # Si el JSON es su archivo "dataset.json" (contiene "conexiones")
                if 'conexiones' in datos:
                    # En este caso, el JSON no declara nodos, solo aristas.
                    # Debemos deducir los nodos a partir de los orígenes y destinos.
                    for conexion in datos['conexiones']:
                        origen = conexion['origen']
                        destino = conexion['destino']
                        
                        # Asignamos valores por defecto a los nodos descubiertos
                        if origen not in nodos:
                            nodos[origen] = {'latitud': 0.0, 'longitud': 0.0, 'tipo': 'subestacion'}
                        if destino not in nodos:
                            nodos[destino] = {'latitud': 0.0, 'longitud': 0.0, 'tipo': 'subestacion'}

                # Formato genérico (lista de nodos)
                elif isinstance(datos, list):
                    for fila in datos:
                        nodos[fila['id']] = {
                            'latitud': float(fila.get('latitud', 0.0)),
                            'longitud': float(fila.get('longitud', 0.0)),
                            'tipo': fila.get('tipo_instalacion', 'subestacion')
                        }

        elif archivo.endswith('.csv'):
            with open(archivo, mode='r', encoding='utf-8') as f:
                lector = csv.DictReader(f)
                for fila in lector:
                    nodos[fila['id']] = {
                        'latitud': float(fila['latitud']),
                        'longitud': float(fila['longitud']),
                        'tipo': fila['tipo_instalacion']
                    }
        else:
            print(f"Formato no soportado para nodos: {archivo}")

    except Exception as e:
        print(f"Error al cargar los nodos desde {archivo}: {e}")
        
    return nodos

def cargar_aristas(archivo):
    """
    Extrae las líneas de transmisión desde un archivo CSV o JSON.
    """
    aristas = []
    # Capacidad nominal por defecto para su proyecto (20 Amperios)
    CAPACIDAD_DEFECTO = 20.0
    
    try:
        if archivo.endswith('.json'):
            with open(archivo, mode='r', encoding='utf-8') as f:
                datos = json.load(f)
                
                # Su archivo estructurado (dataset.json)
                if 'conexiones' in datos:
                    # Extraer el precio del cable Sodimac (S/ 3.98) de la lista de precios
                    precio_metro = 3.98 # Valor por defecto
                    if 'precios' in datos and len(datos['precios']) > 0:
                        precio_metro = datos['precios'][0]['precio_por_metro']

                    for conexion in datos['conexiones']:
                        distancia = float(conexion['distancia_m'])
                        # Cálculo: costo = distancia * precio por metro
                        costo_calculado = distancia * precio_metro
                        
                        aristas.append({
                            'origen': conexion['origen'],
                            'destino': conexion['destino'],
                            'capacidad': CAPACIDAD_DEFECTO,
                            'costo': costo_calculado
                        })

                # Lista de diccionarios estándar
                elif isinstance(datos, list):
                    for fila in datos:
                        aristas.append({
                            'origen': fila['origen'],
                            'destino': fila['destino'],
                            'capacidad': float(fila['capacidad']),
                            'costo': float(fila['costo'])
                        })

        elif archivo.endswith('.csv'):
            with open(archivo, mode='r', encoding='utf-8') as f:
                lector = csv.DictReader(f)
                for fila in lector:
                    aristas.append({
                        'origen': fila['origen'],
                        'destino': fila['destino'],
                        'capacidad': float(fila['capacidad']),
                        'costo': float(fila['costo'])
                    })
        else:
            print(f"Formato no soportado para aristas: {archivo}")

    except Exception as e:
        print(f"Error al cargar las aristas desde {archivo}: {e}")
        
    return aristas