import argparse
import json
from pathlib import Path

from pydantic import TypeAdapter

from backend.config import RED_EJEMPLO
from backend.schemas.geografica import Grafo, PrecioPorMetro
from backend.services.georreferenciado import analizar_georreferenciado


def main():
    parser = argparse.ArgumentParser(description="Analizar una red eléctrica")
    parser.add_argument("archivo", nargs="?", type=Path, default=RED_EJEMPLO)
    parser.add_argument("--algoritmo", choices=("kruskal", "prim", "bfs"), default="kruskal")
    parser.add_argument("--precio-por-metro")
    args = parser.parse_args()
    try:
        grafo = Grafo.model_validate_json(args.archivo.read_text(encoding="utf-8-sig"))
        precio = None
        if args.precio_por_metro is not None:
            precio = TypeAdapter(PrecioPorMetro).validate_python(args.precio_por_metro)
        resultado = analizar_georreferenciado(args.algoritmo, grafo, precio)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Error: {error}\n")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
