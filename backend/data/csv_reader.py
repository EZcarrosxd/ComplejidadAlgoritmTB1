import csv
from io import StringIO

from backend.domain.errors import DatasetValidationError


class LectorCsv:
    def leer(self, texto: str) -> dict:
        try:
            lector = csv.DictReader(StringIO(texto), strict=True)
            columnas = set(lector.fieldnames or [])
            if not {"origen", "destino"}.issubset(columnas):
                raise DatasetValidationError("El CSV necesita columnas origen y destino.")
            filas = list(lector)
            if any(None in fila or None in fila.values() for fila in filas):
                raise DatasetValidationError("Hay filas CSV con columnas incompletas o sobrantes.")
            return {"conexiones": filas}
        except csv.Error as error:
            raise DatasetValidationError("El archivo no contiene CSV válido.") from error
