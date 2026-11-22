from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException


def registrar_errores(app):
    @app.exception_handler(HTTPException)
    async def error_http(request, error):
        return JSONResponse({"error": error.detail}, status_code=error.status_code,
                            headers=error.headers)

    @app.exception_handler(RequestValidationError)
    async def error_peticion(request, error):
        detalle = error.errors()[0]
        mensaje = str(detalle.get("ctx", {}).get("error", "")) or "El grafo o los parámetros enviados no tienen el formato esperado"
        return JSONResponse(
            {"error": mensaje},
            status_code=422,
        )
