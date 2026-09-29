import csv
import json

class DatasetValidationError(Exception):
    """Excepción personalizada para errores de validación del dataset."""
    pass

def cargar_nodos(archivo):
    """
    Extrae las subestaciones eléctricas desde un archivo CSV o JSON.
    Valida que existan al menos 1500 nodos según el requerimiento.
    """
    nodos = {}
    try:
        if archivo.endswith('.json'):
            with open(archivo, mode='r', encoding='utf-8') as f:
                datos = json.load(f)
                
                # Si el JSON es su archivo "dataset.json" (contiene "conexiones")
                if 'conexiones' in datos:
                    for conexion in datos['conexiones']:
                        origen = conexion['origen']
                        destino = conexion['destino']
                        
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
            raise ValueError(f"Formato de archivo no soportado: {archivo}")

        # --- VALIDACIÓN FASE 1
        if len(nodos) < 1500:
            raise DatasetValidationError(f"El dataset contiene solo {len(nodos)} nodos. La rúbrica exige un mínimo de 1500.")

    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {archivo}")
    except DatasetValidationError as dve:
        print(f"Error de Validación: {dve}")
        # Relanzamos la excepción si deseas que la ejecución se detenga completamente
        raise
    except Exception as e:
        print(f"Error inesperado al cargar los nodos: {e}")
        raise
        
    return nodos

def cargar_aristas(archivo):
    """
    Extrae las líneas de transmisión desde un archivo CSV o JSON.
    """
    aristas = []
    CAPACIDAD_DEFECTO = 20.0
    
    try:
        if archivo.endswith('.json'):
            with open(archivo, mode='r', encoding='utf-8') as f:
                datos = json.load(f)
                
                if 'conexiones' in datos:
                    precio_metro = 3.98
                    if 'precios' in datos and len(datos['precios']) > 0:
                        precio_metro = datos['precios'][0]['precio_por_metro']

                    for conexion in datos['conexiones']:
                        distancia = float(conexion['distancia_m'])
                        costo_calculado = distancia * precio_metro
                        
                        aristas.append({
                            'origen': conexion['origen'],
                            'destino': conexion['destino'],
                            'capacidad': CAPACIDAD_DEFECTO,
                            'costo': costo_calculado
                        })

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
        print(f"Error al cargar las aristas: {e}")
        
    return aristas