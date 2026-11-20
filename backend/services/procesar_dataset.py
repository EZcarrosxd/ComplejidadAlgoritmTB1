from backend.data.cargador import CargadorDataset
from backend.data.lector_csv import LectorCsv
from backend.data.lector_json import LectorJson
from .analisis import AnalizadorRed


class ProcesadorDataset:
    def __init__(self):
        self._cargador = CargadorDataset({".json": LectorJson(), ".csv": LectorCsv()})
        self._analizador = AnalizadorRed()

    def procesar(self, contenido: bytes, nombre: str, origen=None, destino=None):
        red = self._cargador.cargar(contenido, nombre)
        return self._analizador.analizar(red, origen, destino)
