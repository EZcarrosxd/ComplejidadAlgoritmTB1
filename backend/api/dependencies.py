from fastapi import HTTPException, Request


def obtener_cargador(request: Request):
    return request.app.state.cargador


def obtener_analizador(request: Request):
    return request.app.state.analizador


def obtener_resultado(request: Request):
    resultado = request.app.state.resultado
    if resultado is None:
        raise HTTPException(status_code=404, detail="Primero cargue un dataset.")
    return resultado
