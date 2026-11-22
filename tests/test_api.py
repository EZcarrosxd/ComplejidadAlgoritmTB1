from pathlib import Path

import pytest


@pytest.mark.parametrize("ruta", [
    "/", "/docs", "/openapi.json", "/static/js/main.js", "/static/css/main.css",
    "/templates/geografica.html", "/static/js/vista-geografica.js",
    "/static/js/proyeccion-geografica.js", "/static/js/datos-georreferenciados.js",
    "/static/js/algoritmos-geograficos.js", "/static/css/geografica.css",
])
def test_paginas(client, ruta):
    assert client.get(ruta).status_code == 200


def test_dataset_de_ejemplo(client):
    ejemplo = Path(__file__).resolve().parents[1] / "dataset/red_osinergmin.json"
    respuesta = client.get("/api/ejemplo")
    assert respuesta.status_code == 200
    assert respuesta.content == ejemplo.read_bytes()


def test_acepta_unicamente_el_json_general(client, dataset):
    ruta = "/api/georreferenciado/kruskal"
    assert client.post(ruta, content=dataset, headers={"Content-Type": "application/json"}).status_code == 422
    assert client.post(ruta, json={"nodos": [], "aristas": []}).status_code == 422
    assert client.post("/api/upload", files={"file": ("red.json", dataset)}).status_code == 404
