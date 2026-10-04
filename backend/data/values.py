from math import isfinite

from backend.domain.errors import DatasetValidationError


def numero(valor, campo):
    try:
        if isinstance(valor, bool):
            raise ValueError()
        resultado = float(valor)
    except (TypeError, ValueError, OverflowError) as error:
        raise DatasetValidationError(f"{campo} debe ser un número.") from error
    if not isfinite(resultado) or resultado < 0:
        raise DatasetValidationError(f"{campo} debe ser finito y no negativo.")
    return resultado


def identificador(valor):
    if not isinstance(valor, str) or not valor.strip():
        raise DatasetValidationError("Cada nodo necesita un identificador de texto no vacío.")
    return valor.strip()
