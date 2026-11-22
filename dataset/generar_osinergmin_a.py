"""Empaqueta o verifica el escenario A a partir de los GeoJSON archivados."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
from zipfile import BadZipFile, ZipFile


RUTA_DATOS = "escenario_diseno_osinergmin/datos/"
ALTERNATIVA = "A_k4"
CANTIDADES = (7208, 315, 17503)


def leer_json(archivo):
    return json.loads(archivo.read_bytes())


def leer_escenario(archivo_zip, referencias):
    origen = referencias["paquetes_de_entrada"]["escenarios_arboles"]
    if sha256(archivo_zip.read_bytes()).hexdigest() != origen["sha256"]:
        raise ValueError("El ZIP del escenario no coincide con la huella de procedencia.")
    with ZipFile(archivo_zip) as zip_escenario:
        def leer_coleccion(nombre):
            return json.loads(zip_escenario.read(f"{RUTA_DATOS}{nombre}.geojson"))

        nodos = leer_coleccion("nodos")
        tramos = leer_coleccion("tramos_documentados")
        candidatas = leer_coleccion("conexiones_candidatas")
    candidatas["features"] = [
        elemento for elemento in candidatas["features"]
        if ALTERNATIVA in elemento["properties"]["alternativas"]
    ]
    return {
        "tipo": "grafo_georreferenciado", "version": 1,
        "alternativa": ALTERNATIVA, "sistema_coordenadas": "EPSG:4326",
        "nodos": nodos, "tramos_documentados": tramos,
        "conexiones_candidatas": candidatas, "procedencia": referencias,
    }


def comprobar_grafo(grafo):
    nodos = grafo["nodos"]["features"]
    tramos = grafo["tramos_documentados"]["features"]
    candidatas = grafo["conexiones_candidatas"]["features"]
    if (len(nodos), len(tramos), len(candidatas)) != CANTIDADES:
        raise ValueError("El escenario A debe contener 7208 nodos, 315 tramos y 17 503 candidatas.")

    posiciones = {nodo["id"]: nodo["geometry"]["coordinates"] for nodo in nodos}
    if len(posiciones) != len(nodos) or len({tuple(coordenadas) for coordenadas in posiciones.values()}) != len(nodos):
        raise ValueError("El escenario contiene IDs o posiciones de nodo repetidos.")

    ids_aristas = set()
    pares = set()
    for aristas, clase in ((tramos, "tramo_documentado"), (candidatas, "candidata_geografica")):
        for arista in aristas:
            props = arista["properties"]
            origen, destino = props["origen"], props["destino"]
            camino = arista["geometry"]["coordinates"]
            par = tuple(sorted((origen, destino)))
            if (props["clase"] != clase or origen == destino or origen not in posiciones
                    or destino not in posiciones or arista["id"] in ids_aristas or par in pares):
                raise ValueError(f"Clase, ID o extremos inválidos en {arista['id']}.")
            if arista["geometry"]["type"] != "LineString" or len(camino) < 2:
                raise ValueError(f"Se esperaba una polilínea en {arista['id']}.")
            if camino[0] != posiciones[origen] or camino[-1] != posiciones[destino]:
                raise ValueError(f"La geometría no coincide con los extremos de {arista['id']}.")
            ids_aristas.add(arista["id"])
            pares.add(par)


def verificar_archivo(archivo_json, esperado):
    archivo = leer_json(archivo_json)
    comprobar_grafo(archivo)
    if archivo != esperado:
        claves = sorted(clave for clave in (archivo.keys() | esperado.keys())
                        if archivo.get(clave) != esperado.get(clave))
        raise ValueError(f"El JSON difiere del escenario archivado en: {', '.join(claves)}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("escenario", type=Path, help="ZIP Escenario_Diseno_Electrico_OSINERGMIN.zip")
    parser.add_argument("referencias", type=Path, help="Dataset/fuentes/referencias_fuentes.json")
    parser.add_argument("json", type=Path, help="Ruta de dataset_osinergmin_A.json")
    parser.add_argument("--verificar", action="store_true", help="Compara el JSON existente sin escribir archivos.")
    args = parser.parse_args()
    try:
        escenario = leer_escenario(args.escenario, leer_json(args.referencias))
        comprobar_grafo(escenario)
        if not args.verificar:
            with args.json.open("x", encoding="utf-8", newline="\n") as salida:
                json.dump(escenario, salida, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
                salida.write("\n")
        verificar_archivo(args.json, escenario)
    except (OSError, BadZipFile, ValueError, KeyError) as error:
        parser.exit(1, f"Error: {error}\n")
    print(f"{args.json}: 7208 nodos, 315 tramos y 17 503 candidatas verificados.")


if __name__ == "__main__":
    main()
