import json

import pytest

from backend.data.csv_reader import LectorCsv
from backend.data.json_reader import LectorJson
from backend.data.loader import CargadorDataset
from backend.domain.errors import DatasetValidationError


def cargar(datos):
    cargador = CargadorDataset({".json": LectorJson()}, minimo=2)
    return cargador.cargar(json.dumps(datos).encode(), "red.json")


@pytest.mark.parametrize("valor", [-1, float("nan"), float("inf"), None, True, "hola"])
@pytest.mark.parametrize("campo", ["costo", "capacidad", "distancia_m"])
def test_numeros_invalidos(valor, campo):
    fila = {"origen": "A", "destino": "B", "distancia_m": 2, campo: valor}
    with pytest.raises(DatasetValidationError):
        cargar({"conexiones": [fila]})


def test_nodos_aislados_se_conservan_y_capacidad_explicita():
    red = cargar({"nodos": [{"id": "A"}, {"id": "B"}, {"id": "C"}],
                  "conexiones": [{"origen": "A", "destino": "B", "costo": 3,
                                  "capacidad": 7}]})
    assert len(red.nodos) == 3
    assert red.adyacencia["C"] == []
    assert red.aristas[0]["capacidad"] == 7


@pytest.mark.parametrize("nodos", [[{"id": "A"}, {"id": "A"}], [{"id": "A"}]])
def test_nodos_repetidos_o_extremo_inexistente(nodos):
    with pytest.raises(DatasetValidationError):
        cargar({"nodos": nodos, "conexiones": [
            {"origen": "A", "destino": "B", "costo": 1}]})


@pytest.mark.parametrize("fila", [None, {}, {"origen": "A", "destino": "A", "costo": 0}])
def test_conexiones_invalidas(fila):
    with pytest.raises(DatasetValidationError):
        cargar({"conexiones": [fila]})


def test_csv_bom_y_columnas_explicitas():
    cargador = CargadorDataset({".csv": LectorCsv()}, minimo=2)
    red = cargador.cargar(b"\xef\xbb\xbforigen,destino,costo,capacidad\nA,B,4,7", "red.csv")
    assert red.aristas[0] == dict(origen="A", destino="B", costo=4, capacidad=7)


def test_contrato_de_lector_es_sustituible():
    class LectorDePrueba:
        def leer(self, texto):
            return {"conexiones": [{"origen": "A", "destino": "B", "costo": 5}]}

    cargador = CargadorDataset({".prueba": LectorDePrueba()}, minimo=2)
    assert len(cargador.cargar(b"", "red.prueba").nodos) == 2
