from fastapi import HTTPException, Request


def obtener_procesador(request: Request):
    return request.app.state.procesador


def obtener_resultado(request: Request):
    resultado = request.app.state.resultado
    if resultado is None:
        raise HTTPException(status_code=404, detail="Primero cargue un dataset")
    return resultado
