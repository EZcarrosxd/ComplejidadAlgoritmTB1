import os
import shutil
import subprocess
from pathlib import Path

import pytest

from dataset.generar_osinergmin_a import comprobar_grafo


RAIZ = Path(__file__).resolve().parents[1]


@pytest.mark.skipif(shutil.which("node") is None, reason="Se necesita Node.js para probar el visor")
def test_visor_georreferenciado_en_node():
    resultado = subprocess.run(
        ["node", "--test", str(RAIZ / "tests/js/geografica.test.mjs")],
        capture_output=True, text=True, encoding="utf-8", env=os.environ.copy(),
    )
    assert resultado.returncode == 0, resultado.stdout + resultado.stderr


def test_frontend_publica_la_vista_georreferenciada(client):
    for ruta in ["/templates/geografica.html", "/static/js/vista-geografica.js",
                 "/static/js/proyeccion-geografica.js", "/static/js/datos-georreferenciados.js",
                 "/static/css/geografica.css"]:
        assert client.get(ruta).status_code == 200
    assert "/templates/geografica.html" in client.get("/templates/analizar.html").text


def test_la_vista_georreferenciada_no_usa_pivot_mds():
    for nombre in ["vista-geografica.js", "proyeccion-geografica.js", "datos-georreferenciados.js"]:
        codigo = (RAIZ / "frontend/static/js" / nombre).read_text(encoding="utf-8")
        assert "distribucion.js" not in codigo
        assert "Math.random" not in codigo


def test_comprobar_grafo_exige_las_cantidades_del_escenario_a():
    grafo = {"nodos": {"features": []}, "tramos_documentados": {"features": []},
             "conexiones_candidatas": {"features": []}}
    with pytest.raises(ValueError):
        comprobar_grafo(grafo)
