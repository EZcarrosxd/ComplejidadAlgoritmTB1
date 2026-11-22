import pytest
from fastapi.testclient import TestClient

from backend.fabrica import crear_app


@pytest.fixture
def deployed(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", " https://mi-red.pages.dev/ ,https://red.example.com")
    with TestClient(crear_app()) as client:
        yield client


def test_health_no_requiere_dataset(deployed):
    respuesta = deployed.get("/health")
    assert respuesta.status_code == 200
    assert respuesta.json() == {"status": "ok"}


def test_origen_permitido_en_analisis_y_error(deployed):
    origen = "https://mi-red.pages.dev"
    ruta = "/api/georreferenciado/bfs"
    respuesta = deployed.post(ruta, headers={"Origin": origen},
                              json={"nodos": [{"id": "p", "coordenadas": [0, 0]}], "aristas": []})
    assert respuesta.status_code == 200
    assert respuesta.headers["access-control-allow-origin"] == origen
    error = deployed.post(ruta, headers={"Origin": origen})
    assert error.status_code == 422
    assert error.headers["access-control-allow-origin"] == origen


@pytest.mark.parametrize("origen,permitido", [
    ("https://mi-red.pages.dev", True), ("https://red.example.com", True),
    ("https://otro.pages.dev", False), ("https://mi-red.pages.dev.ejemplo.com", False),
])
def test_preflight_con_dominio_exacto(deployed, origen, permitido):
    respuesta = deployed.options("/api/georreferenciado/bfs", headers={
        "Origin": origen,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert respuesta.status_code == (200 if permitido else 400)
    assert ("access-control-allow-origin" in respuesta.headers) is permitido


def test_frontend_sin_jinja(client):
    for ruta in ["/", "/templates/resultados.html", "/templates/metricas.html",
                 "/static/js/bootstrap.js", "/static/js/config.js"]:
        respuesta = client.get(ruta)
        assert respuesta.status_code == 200
        assert "{%" not in respuesta.text
    assert '/static/js/bootstrap.js' in client.get('/').text
