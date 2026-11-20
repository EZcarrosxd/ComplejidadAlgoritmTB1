import json

from backend.domain.errores import ErrorValidacionDatos


class LectorJson:
    def leer(self, texto: str) -> dict:
        try:
            datos = json.loads(texto)
        except (ValueError, RecursionError) as error:
            raise ErrorValidacionDatos("El archivo no contiene JSON válido") from error
        if isinstance(datos, list):
            datos = {"conexiones": datos}
        if not isinstance(datos, dict):
            raise ErrorValidacionDatos("El JSON debe ser un objeto o lista de conexiones")
        return datos
