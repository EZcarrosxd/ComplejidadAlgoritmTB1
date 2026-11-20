import argparse
import json
from pathlib import Path

from backend.config import DATASET
from backend.services.procesar_dataset import ProcesadorDataset


def main():
    parser = argparse.ArgumentParser(description="Analizar una red eléctrica")
    parser.add_argument("archivo", nargs="?", type=Path, default=DATASET)
    parser.add_argument("--origen")
    parser.add_argument("--destino")
    args = parser.parse_args()
    try:
        resultado = ProcesadorDataset().procesar(
            args.archivo.read_bytes(), args.archivo.name, args.origen, args.destino,
        )
    except (OSError, ValueError) as error:
        parser.exit(1, f"Error: {error}\n")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
