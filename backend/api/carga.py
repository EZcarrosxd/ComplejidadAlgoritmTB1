from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile

from backend.config import MAXIMO_BYTES
from backend.schemas.analisis import RespuestaCarga, ResultadoAnalisis
from .dependencias import obtener_procesador

router = APIRouter(prefix="/api", tags=["Análisis"])


@router.post("/upload", response_model=RespuestaCarga)
def cargar_dataset(
    request: Request,
    file: UploadFile,
    origen: str | None = Form(None),
    destino: str | None = Form(None),
    procesador=Depends(obtener_procesador),
):

    try:
        contenido = file.file.read(MAXIMO_BYTES + 1)
        if len(contenido) > MAXIMO_BYTES:
            raise HTTPException(status_code=413, detail="El archivo supera los 10 MiB")
        datos = procesador.procesar(contenido, file.filename or "", origen, destino)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        file.file.close()
    resultado = ResultadoAnalisis.model_validate(datos)

    request.app.state.resultado = resultado.model_dump(by_alias=True)
    return {"mensaje": "Red procesada con éxito", "datos": resultado}
