from fastapi import APIRouter, Depends

from .dependencies import obtener_resultado

router = APIRouter(prefix="/api", tags=["Último análisis"])


@router.get("/network-status")
def estado_red(datos=Depends(obtener_resultado)):
    return {"nodos_criticos": datos["nodos_criticos"], "metadata": datos["metadata"]}


@router.get("/optimization/mst")
def resultado_mst(datos=Depends(obtener_resultado)):
    return {
        "costo_minimo_instalacion": datos["costo_minimo_instalacion"],
        "aristas_mst": datos["aristas_mst"],
        "red_conectada": datos["metadata"]["red_conectada"],
        "componentes": datos["metadata"]["componentes"],
    }


@router.get("/optimization/flow")
def resultado_flujo(datos=Depends(obtener_resultado)):
    return {
        "flujo_maximo_red": datos["flujo_maximo_red"],
        "lineas_corte_minimo": datos["lineas_corte_minimo"],
        "origen_evaluado": datos["metadata"]["origen_flujo"],
        "destino_evaluado": datos["metadata"]["destino_flujo"],
    }
