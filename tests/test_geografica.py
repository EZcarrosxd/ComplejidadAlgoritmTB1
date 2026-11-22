import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

from dataset.generar_osinergmin import comprobar_grafo


RAIZ = Path(__file__).resolve().parents[1]
RUTA = "/api/georreferenciado/analizar"
NODOS = ["N1", "N2", "N3", "N4"]
ARISTAS = [[0, 1, 4000], [1, 2, 1000], [2, 3, 2000], [0, 3, 3000], [0, 2, 5000]]
INFORME = {
    "A": {"aristas": 17818, "peso_mm": 137416341},
    "B": {"aristas": 33709, "peso_mm": 137411789},
}


def analizar(client, algoritmo, nodos=NODOS, aristas=ARISTAS):
    return client.post(RUTA, json={"algoritmo": algoritmo, "nodos": nodos, "aristas": aristas})


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
                 "/static/js/algoritmos-geograficos.js", "/static/css/geografica.css"]:
        assert client.get(ruta).status_code == 200
    assert "/templates/geografica.html" in client.get("/templates/analizar.html").text


def test_la_vista_georreferenciada_no_usa_pivot_mds():
    for nombre in ["vista-geografica.js", "proyeccion-geografica.js", "datos-georreferenciados.js",
                   "algoritmos-geograficos.js"]:
        codigo = (RAIZ / "frontend/static/js" / nombre).read_text(encoding="utf-8")
        assert "distribucion.js" not in codigo
        assert "Math.random" not in codigo


def test_comprobar_grafo_exige_las_cantidades_de_cada_alternativa():
    grafo = {"nodos": {"features": []}, "tramos_documentados": {"features": []},
             "conexiones_candidatas": {"features": []}}
    for letra in "AB":
        with pytest.raises(ValueError):
            comprobar_grafo(grafo, letra)


@pytest.mark.parametrize("algoritmo", ["kruskal", "prim"])
def test_arbol_minimo_en_un_grafo_pequeno(client, algoritmo):
    respuesta = analizar(client, algoritmo)
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["cantidad"] == 3
    assert datos["peso_total_mm"] == 6000
    assert sorted(datos["aristas_seleccionadas"]) == [1, 2, 3]


def test_bfs_cuenta_componentes(client):
    conexo = analizar(client, "bfs").json()
    assert conexo["conexo"] is True and conexo["componentes"] == 1
    separado = analizar(client, "bfs", aristas=[[0, 1, 10], [2, 3, 10]]).json()
    assert separado["conexo"] is False
    assert separado["componentes"] == 2
    assert separado["mayor_componente"] == 2


@pytest.mark.parametrize("aristas", [
    [[0, 9, 10]], [[0, 0, 10]], [[0, 1, 0]], [[0, 1, 10], [1, 0, 20]],
])
def test_rechaza_aristas_invalidas(client, aristas):
    respuesta = analizar(client, "kruskal", aristas=aristas)
    assert respuesta.status_code == 400
    assert respuesta.json()["error"]


def test_rechaza_formato_incorrecto(client):
    respuesta = client.post(RUTA, json={"algoritmo": "dijkstra", "nodos": NODOS, "aristas": ARISTAS})
    assert respuesta.status_code == 422
    assert respuesta.json()["error"] == "El grafo enviado no tiene el formato esperado"


def compactar(ruta):
    paquete = json.loads(Path(ruta).read_text(encoding="utf-8"))
    ids = [nodo["id"] for nodo in paquete["nodos"]["features"]]
    indices = {identificador: i for i, identificador in enumerate(ids)}
    aristas = [
        [indices[f["properties"]["origen"]], indices[f["properties"]["destino"]], f["properties"]["peso_mm"]]
        for f in paquete["tramos_documentados"]["features"] + paquete["conexiones_candidatas"]["features"]
    ]
    return ids, aristas


@pytest.mark.parametrize("letra", ["A", "B"])
def test_resultados_del_informe_con_los_datos_reales(client, letra):
    ruta = os.environ.get(f"DATASET_OSINERGMIN_{letra}")
    if not ruta:
        pytest.skip(f"Define DATASET_OSINERGMIN_{letra} con la ruta del JSON")
    nodos, aristas = compactar(ruta)
    assert len(nodos) == 7208
    assert len(aristas) == INFORME[letra]["aristas"]

    kruskal = analizar(client, "kruskal", nodos, aristas).json()
    prim = analizar(client, "prim", nodos, aristas).json()
    bfs = analizar(client, "bfs", nodos, aristas).json()

    assert kruskal["cantidad"] == prim["cantidad"] == 7207
    assert kruskal["peso_total_mm"] == prim["peso_total_mm"] == INFORME[letra]["peso_mm"]
    assert sum(aristas[i][2] for i in kruskal["aristas_seleccionadas"]) == kruskal["peso_total_mm"]
    assert sum(aristas[i][2] for i in prim["aristas_seleccionadas"]) == prim["peso_total_mm"]
    assert len(set(kruskal["aristas_seleccionadas"]) & set(prim["aristas_seleccionadas"])) == 7205
    assert bfs["conexo"] is True and bfs["componentes"] == 1
    for arbol in (kruskal, prim):
        assert es_arbol_de_expansion(len(nodos), [aristas[i] for i in arbol["aristas_seleccionadas"]])


def es_arbol_de_expansion(cantidad_nodos, aristas):
    padre = list(range(cantidad_nodos))

    def raiz(nodo):
        while padre[nodo] != nodo:
            padre[nodo] = padre[padre[nodo]]
            nodo = padre[nodo]
        return nodo

    for origen, destino, _ in aristas:
        a, b = raiz(origen), raiz(destino)
        if a == b:
            return False
        padre[a] = b
    return len(aristas) == cantidad_nodos - 1
