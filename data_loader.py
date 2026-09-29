import csv

def cargar_nodos(archivo):
    """
    Extrae las subestaciones eléctricas desde un archivo CSV.
    Se espera que el CSV tenga las columnas: id, latitud, longitud, tipo_instalacion.
    """
    nodos = {}
    try:
        with open(archivo, mode='r', encoding='utf-8') as f:
            lector = csv.DictReader(f)
            for fila in lector:
                nodos[fila['id']] = {
                    'latitud': float(fila['latitud']),
                    'longitud': float(fila['longitud']),
                    'tipo': fila['tipo_instalacion']
                }
    except Exception as e:
        print(f"Error al cargar los nodos: {e}")
    return nodos

def cargar_aristas(archivo):
    """
    Extrae las líneas de transmisión desde un archivo CSV.
    Se espera que el CSV tenga las columnas: origen, destino, capacidad, costo.
    """
    aristas = []
    try:
        with open(archivo, mode='r', encoding='utf-8') as f:
            lector = csv.DictReader(f)
            for fila in lector:
                aristas.append({
                    'origen': fila['origen'],
                    'destino': fila['destino'],
                    'capacidad': float(fila['capacidad']),
                    'costo': float(fila['costo'])
                })
    except Exception as e:
        print(f"Error al cargar las aristas: {e}")
    return aristas