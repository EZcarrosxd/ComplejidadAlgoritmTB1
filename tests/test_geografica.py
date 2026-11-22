import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest


RAIZ = Path(__file__).resolve().parents[1]
RUTA = "/api/georreferenciado"
REFERENCIAS = [
    ("red_osinergmin.json", "dataset_osinergmin_A.json", 17818, 137416341),
    ("red_osinergmin_ampliada.json", "dataset_osinergmin_B.json", 33709, 137411789),
]


def leer_json(ruta):
    return json.loads(ruta.read_bytes())


@pytest.fixture
def red_pequena():
    return leer_json(RAIZ / "tests/datos/red_pequena.json")


@pytest.mark.skipif(shutil.which("node") is None, reason="Se necesita Node.js para probar el visor")
def test_visor_georreferenciado_en_node():
    resultado = subprocess.run(
        ["node", "--test", str(RAIZ / "tests/js/geografica.test.mjs")],
        capture_output=True, text=True, encoding="utf-8",
    )
    assert resultado.returncode == 0, resultado.stdout + resultado.stderr


@pytest.mark.parametrize("algoritmo", ["kruskal", "prim"])
def test_arbol_minimo_con_aristas_paralelas_y_precio(client, red_pequena, algoritmo):
    ruta = f"{RUTA}/{algoritmo}"
    salida = client.post(ruta, json=red_pequena)
    assert salida.status_code == 200
    original = salida.json()
    assert original["peso_total_mm"] == 8000
    assert set(original["aristas_seleccionadas"]) == {"c-1", "t-1"}
    assert "costo_estimado" not in original

    for arista in red_pequena["aristas"]:
        clases = {"candidata_geografica": "tramo_documentado", "tramo_documentado": "candidata_geografica"}
        arista["clase"] = clases[arista["clase"]]
    con_precio = client.post(ruta, params={"precio_por_metro": "3.98"}, json=red_pequena).json()
    assert con_precio["peso_total_mm"] == original["peso_total_mm"]
    assert con_precio["aristas_seleccionadas"] == original["aristas_seleccionadas"]
    assert con_precio["costo_estimado"] == "31.84"


def test_bosque_y_bfs_en_una_red_separada(client):
    grafo = leer_json(RAIZ / "tests/datos/red_separada.json")
    for algoritmo in ("kruskal", "prim"):
        datos = client.post(f"{RUTA}/{algoritmo}", json=grafo).json()
        assert datos["componentes"] == 3
        assert datos["peso_total_mm"] == 3500
        assert set(datos["aristas_seleccionadas"]) == {"enlace-1", "enlace-2"}

    bfs = client.post(f"{RUTA}/bfs", json=grafo).json()
    assert (bfs["conexo"], bfs["componentes"], bfs["mayor_componente"]) == (False, 3, 2)


@pytest.mark.parametrize("algoritmo", ["kruskal", "prim", "bfs"])
def test_acepta_una_red_sin_aristas(client, algoritmo):
    grafo = {"nodos": [{"id": "único", "coordenadas": [0, 0]}], "aristas": []}
    respuesta = client.post(f"{RUTA}/{algoritmo}", json=grafo)
    assert respuesta.status_code == 200
    assert respuesta.json()["componentes"] == 1
    assert respuesta.json()["aristas"] == 0


@pytest.mark.parametrize("cambio", [
    {"origen": "inexistente"}, {"destino": "poste-1"}, {"peso_mm": -1}, {"peso_mm": 2.5},
    {"peso_mm": "1000"}, {"clase": "otro"}, {"id": "t-1"}, {"costo": 8}, {"trazado": None},
    {"trazado": [[-77.05, -12.05], [-77.04, -12.05]]},
    {"trazado": [[-77.05, -12.05], [-181, -12.04], [-77.04, -12.05]]},
    {"trazado": [[-77.04, -12.05], [-77.045, -12.04], [-77.05, -12.05]]},
])
def test_rechaza_aristas_invalidas(client, red_pequena, cambio):
    red_pequena["aristas"][0].update(cambio)
    respuesta = client.post(f"{RUTA}/kruskal", json=red_pequena)
    assert respuesta.status_code == 422
    assert respuesta.json()["error"]


@pytest.mark.parametrize("cambio", [
    {"id": "poste-2"}, {"id": " "}, {"coordenadas": [-77.05, -91]}, {"coordenadas": ["-77.05", -12.05]},
])
def test_rechaza_nodos_invalidos(client, red_pequena, cambio):
    red_pequena["nodos"][0].update(cambio)
    assert client.post(f"{RUTA}/bfs", json=red_pequena).status_code == 422


@pytest.mark.parametrize("precio", ["-0.1", "NaN", "1.01234", "100000000"])
def test_rechaza_precios_invalidos(client, red_pequena, precio):
    respuesta = client.post(f"{RUTA}/prim", params={"precio_por_metro": precio}, json=red_pequena)
    assert respuesta.status_code == 422


@pytest.mark.parametrize("nombre,original,cantidad,peso", REFERENCIAS)
def test_resultados_originales(client, nombre, original, cantidad, peso):
    grafo = leer_json(RAIZ / "dataset" / nombre)
    assert len(grafo["nodos"]) == 7208
    assert len(grafo["aristas"]) == cantidad
    aristas = {arista["id"]: arista for arista in grafo["aristas"]}
    for algoritmo in ("kruskal", "prim"):
        respuesta = client.post(f"{RUTA}/{algoritmo}", json=grafo)
        assert respuesta.status_code == 200
        resultado = respuesta.json()
        assert resultado["cantidad"] == 7207
        assert resultado["peso_total_mm"] == peso
        seleccionadas = [aristas[identificador] for identificador in resultado["aristas_seleccionadas"]]
        assert sum(arista["peso_mm"] for arista in seleccionadas) == peso
        assert es_arbol_de_expansion(grafo["nodos"], seleccionadas)
    bfs = client.post(f"{RUTA}/bfs", json=grafo).json()
    assert (bfs["conexo"], bfs["componentes"], bfs["mayor_componente"]) == (True, 1, 7208)


def es_arbol_de_expansion(nodos, aristas):
    padre = {nodo["id"]: nodo["id"] for nodo in nodos}

    def raiz(nodo):
        while padre[nodo] != nodo:
            padre[nodo] = padre[padre[nodo]]
            nodo = padre[nodo]
        return nodo

    for arista in aristas:
        origen = raiz(arista["origen"])
        destino = raiz(arista["destino"])
        if origen == destino:
            return False
        padre[origen] = destino
    return len(aristas) == len(nodos) - 1


@pytest.mark.parametrize("nombre,original,cantidad,peso", REFERENCIAS)
def test_conversion_conserva_id_extremos_peso_y_geometria(nombre, original, cantidad, peso):
    respaldo = RAIZ / "tmp/respaldo-datasets" / original
    if not respaldo.is_file():
        pytest.skip("Esta comprobación requiere el respaldo local del GeoJSON original")
    viejo = leer_json(respaldo)
    nuevo = leer_json(RAIZ / "dataset" / nombre)
    posiciones = {nodo["id"]: nodo["coordenadas"] for nodo in nuevo["nodos"]}
    assert nuevo["nodos"] == [
        {"id": nodo["id"], "coordenadas": nodo["geometry"]["coordinates"]}
        for nodo in viejo["nodos"]["features"]
    ]

    antiguas = viejo["tramos_documentados"]["features"] + viejo["conexiones_candidatas"]["features"]
    for antigua, arista in zip(antiguas, nuevo["aristas"], strict=True):
        assert arista["id"] == antigua["id"]
        for campo in ("origen", "destino", "peso_mm", "clase"):
            assert arista[campo] == antigua["properties"][campo]
        original = antigua["geometry"]["coordinates"]
        assert ("trazado" in arista) == (len(original) > 2)
        assert arista.get("trazado", [posiciones[arista["origen"]], posiciones[arista["destino"]]]) == original


def test_conversion_reproducible_y_conserva_original(tmp_path):
    nodos = [
        {"type": "Feature", "id": "p1", "geometry": {"type": "Point", "coordinates": [-77, -12]},
         "properties": {"administrativo": "ejemplo"}},
        {"type": "Feature", "id": "p2", "geometry": {"type": "Point", "coordinates": [-76, -12]}},
    ]
    arista = {
        "type": "Feature", "id": "r1", "geometry": {"type": "LineString", "coordinates": [[-77, -12], [-76, -12]]},
        "properties": {"origen": "p1", "destino": "p2", "peso_mm": 1000, "clase": "tramo_documentado", "extra": 8},
    }
    fuente = {
        "nodos": {"type": "FeatureCollection", "features": nodos},
        "tramos_documentados": {"type": "FeatureCollection", "features": [arista]},
        "conexiones_candidatas": {"type": "FeatureCollection", "features": []},
    }
    original = tmp_path / "original.json"
    salida = tmp_path / "salida.json"
    original.write_text(json.dumps(fuente), encoding="utf-8")
    contenido_original = original.read_bytes()
    comando = [sys.executable, "-m", "dataset.convertir_red", str(original), str(salida)]
    assert subprocess.run(comando, cwd=RAIZ, capture_output=True).returncode == 0
    assert subprocess.run([*comando, "--verificar"], cwd=RAIZ, capture_output=True).returncode == 0
    assert subprocess.run(comando, cwd=RAIZ, capture_output=True).returncode != 0
    assert original.read_bytes() == contenido_original
    assert set(leer_json(salida)["aristas"][0]) == {"id", "origen", "destino", "peso_mm", "clase"}
