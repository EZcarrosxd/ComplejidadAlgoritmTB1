from pathlib import Path

from backend.config import MINIMO_NODOS
from backend.domain.errors import DatasetValidationError
from backend.domain.network import RedElectrica
from .edges import normalizar_aristas
from .nodes import normalizar_nodos
from .reader import LectorDataset


class CargadorDataset:


    def __init__(self, lectores: dict[str, LectorDataset], minimo=MINIMO_NODOS):
        self.lectores = lectores
        self.minimo = minimo

    def cargar(self, contenido: bytes, nombre: str) -> RedElectrica:
        lector = self.lectores.get(Path(nombre).suffix.lower())
        if lector is None:
            raise DatasetValidationError("Formato no soportado. Use .json o .csv.")
        try:
            texto = contenido.decode("utf-8-sig")
        except UnicodeDecodeError as error:
            raise DatasetValidationError("Guarde el archivo con codificación UTF-8.") from error
        datos = lector.leer(texto)
        aristas = normalizar_aristas(datos)
        nodos = normalizar_nodos(datos, aristas, self.minimo)
        return RedElectrica(nodos, aristas)
