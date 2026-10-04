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
        return JSONResponse(
            {"error": "Petición inválida. Envíe el archivo en el campo file."},
            status_code=422,
        )
