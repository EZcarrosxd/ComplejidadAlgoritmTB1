import argparse
import json
from pathlib import Path

from backend.config import DATASET
from backend.data.csv_reader import LectorCsv
from backend.data.json_reader import LectorJson
from backend.data.loader import CargadorDataset
from backend.services.analysis import AnalizadorRed


def main():
    parser = argparse.ArgumentParser(description="Analizar una red eléctrica")
    parser.add_argument("archivo", nargs="?", type=Path, default=DATASET)
    parser.add_argument("--origen")
    parser.add_argument("--destino")
    args = parser.parse_args()
    cargador = CargadorDataset({".json": LectorJson(), ".csv": LectorCsv()})
    try:
        red = cargador.cargar(args.archivo.read_bytes(), args.archivo.name)
        resultado = AnalizadorRed().analizar(red, args.origen, args.destino)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Error: {error}\n")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
