from pathlib import Path

import pytest


@pytest.mark.parametrize("ruta", ["/", "/docs", "/openapi.json", "/static/js/main.js",
                                  "/static/css/main.css"])
def test_paginas(client, ruta):
    assert client.get(ruta).status_code == 200


@pytest.mark.parametrize("ruta", ["network-status", "optimization/mst", "optimization/flow"])
def test_sin_datos_es_404(client, ruta):
    assert client.get("/api/" + ruta).status_code == 404


def test_dataset_completo_y_consultas(client, dataset):
    respuesta = client.post("/api/upload", files={"file": ("red.json", dataset)})
    assert respuesta.status_code == 200
    datos = respuesta.json()["datos"]
    assert datos["metadata"]["total_nodos"] == 1500
    assert datos["metadata"]["total_aristas"] == 2767
    assert datos["metadata"]["red_conectada"] is True
    assert datos["costo_minimo_instalacion"] == 132156.46
    assert datos["flujo_maximo_red"] == 20
    assert len(datos["aristas_mst"]) == 1499
    assert len(datos["nodos_criticos"]) == 14
    assert len(datos["grafo_visual"]["nodos"]) == 200
    assert "from" in datos["grafo_visual"]["aristas"][0]
    assert all(n["grado"] > 0 for n in datos["grafo_visual"]["nodos"])
    assert len(datos["impacto_criticos"]) == 14
    visibles = {n["id"] for n in datos["grafo_visual"]["nodos"]}
    assert set(datos["nodos_criticos"]) <= visibles
    assert set(datos["caminos_flujo"][0]) <= visibles
    assert datos["caminos_flujo"][0][0] == datos["metadata"]["origen_flujo"]
    assert datos["metadata"]["costo_total_red"] > datos["costo_minimo_instalacion"]
    assert client.get("/api/network-status").json()["metadata"] == datos["metadata"]
    assert client.get("/api/optimization/mst").json()["aristas_mst"] == datos["aristas_mst"]
    assert client.get("/api/optimization/flow").json()["flujo_maximo_red"] == 20


def test_csv_incluido_equivale_a_json(client, dataset):
    csv = Path("dataset/conexiones.csv").read_bytes()
    a = client.post("/api/upload", files={"file": ("red.csv", csv)}).json()["datos"]
    b = client.post("/api/upload", files={"file": ("red.json", dataset)}).json()["datos"]
    a.pop("tiempo_ejecucion")
    b.pop("tiempo_ejecucion")
    assert a == b


def test_flujo_manual_y_error_conserva_ultimo_resultado(client, dataset):
    archivo = {"file": ("red.JSON", dataset)}
    respuesta = client.post("/api/upload", files=archivo,
                            data={"origen": "N-1", "destino": "N-2"})
    assert respuesta.status_code == 200
    assert respuesta.json()["datos"]["metadata"]["seleccion_flujo"] == "manual"
    previo = client.get("/api/optimization/flow").json()
    for campos in ({"origen": "N-1"}, {"origen": "X", "destino": "N-2"},
                   {"origen": "N-1", "destino": "N-1"}):
        assert client.post("/api/upload", files=archivo, data=campos).status_code == 400
    assert client.get("/api/optimization/flow").json() == previo


@pytest.mark.parametrize("nombre,contenido", [
    ("red.txt", b"hola"), ("red.json", b"{"), ("red.json", b"[]"),
    ("red.json", b"\xff"), ("red.csv", b"id,latitud\nN-1,0"),
    ("red.json", b'{"conexiones":[{"origen":"A","destino":"B","costo":1}]}'),
])
def test_archivos_invalidos(client, nombre, contenido):
    respuesta = client.post("/api/upload", files={"file": (nombre, contenido)})
    assert respuesta.status_code == 400
    assert respuesta.json()["error"]


def test_archivo_faltante_y_grande(client):
    assert client.post("/api/upload").status_code == 422
    archivo = {"file": ("red.json", b" " * (10 * 1024 * 1024 + 1))}
    assert client.post("/api/upload", files=archivo).status_code == 413
