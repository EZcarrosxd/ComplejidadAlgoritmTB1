import argparse
import json
from pathlib import Path

from backend.schemas.geografica import Grafo


def leer_elementos(coleccion, tipo_geometria):
    if coleccion["type"] != "FeatureCollection":
        raise ValueError("Se esperaba una colección GeoJSON")
    for elemento in coleccion["features"]:
        geometria = elemento["geometry"]
        if elemento["type"] != "Feature" or geometria["type"] != tipo_geometria:
            raise ValueError(f"Geometría inesperada en {elemento['id']}")
        yield elemento, geometria["coordinates"]


def convertir_red(paquete):
    nodos = [
        {"id": elemento["id"], "coordenadas": coordenadas}
        for elemento, coordenadas in leer_elementos(paquete["nodos"], "Point")
    ]
    posiciones = {nodo["id"]: nodo["coordenadas"] for nodo in nodos}
    aristas = []
    for coleccion in ("tramos_documentados", "conexiones_candidatas"):
        for elemento, camino in leer_elementos(paquete[coleccion], "LineString"):
            datos = elemento["properties"]
            arista = {"id": elemento["id"]}
            arista.update({clave: datos[clave] for clave in ("origen", "destino", "peso_mm", "clase")})
            origen = posiciones[arista["origen"]]
            destino = posiciones[arista["destino"]]
            if len(camino) < 2 or camino[0] != origen or camino[-1] != destino:
                raise ValueError(f"La geometría de {arista['id']} no coincide con sus extremos")
            if len(camino) > 2:
                arista["trazado"] = camino
            aristas.append(arista)

    red = {"nodos": nodos, "aristas": aristas}
    Grafo.model_validate(red)
    return red


def main():
    parser = argparse.ArgumentParser(description="Reduce un JSON georreferenciado de colecciones GeoJSON")
    parser.add_argument("original", type=Path)
    parser.add_argument("salida", type=Path)
    parser.add_argument("--verificar", action="store_true", help="Comprueba el archivo existente sin escribirlo")
    args = parser.parse_args()
    try:
        if args.original.resolve() == args.salida.resolve():
            raise ValueError("La salida debe tener una ruta distinta del original")
        paquete = json.loads(args.original.read_text(encoding="utf-8-sig"))
        red = convertir_red(paquete)
        contenido = json.dumps(red, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
        if args.verificar:
            if args.salida.read_text(encoding="utf-8") != contenido:
                raise ValueError("El archivo no coincide con la conversión del original")
        else:
            with args.salida.open("x", encoding="utf-8", newline="\n") as salida:
                salida.write(contenido)
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f"Error: {error}\n")
    print(f"{args.salida} · {len(red['nodos'])} nodos · {len(red['aristas'])} aristas")


if __name__ == "__main__":
    main()
