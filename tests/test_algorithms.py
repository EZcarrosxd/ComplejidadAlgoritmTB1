import pytest

from backend.algorithms.articulacion import encontrar_nodos_criticos
from backend.algorithms.flujo import calcular_flujo_maximo
from backend.algorithms.kruskal import optimizar_costos_kruskal
from backend.domain.network import RedElectrica
from backend.services.analysis import AnalizadorRed


def linea(a, b, costo=1, capacidad=1):
    return dict(origen=a, destino=b, costo=costo, capacidad=capacidad)


def test_triangulo_mst_flujo_y_corte():
    nodos = dict.fromkeys("ABC")
    aristas = [linea("A", "B", 1, 3), linea("B", "C", 2, 2), linea("A", "C", 5, 1)]
    red = RedElectrica(nodos, aristas)
    mst, costo = optimizar_costos_kruskal(nodos, aristas)
    flujo, corte = calcular_flujo_maximo(nodos, aristas, "A", "C")
    assert costo == 3 and len(mst) == 2
    assert flujo == 3
    assert corte == [{"origen": "B", "destino": "C"}, {"origen": "A", "destino": "C"}]
    assert encontrar_nodos_criticos(nodos, red.adyacencia) == []


def test_dfs_iterativo_en_cadena_de_1500_nodos():
    nodos = dict.fromkeys(str(i) for i in range(1500))
    aristas = [linea(str(i), str(i + 1)) for i in range(1499)]
    red = RedElectrica(nodos, aristas)
    criticos = encontrar_nodos_criticos(nodos, red.adyacencia)
    assert set(criticos) == set(str(i) for i in range(1, 1499))


def test_desconectada_no_se_presenta_como_arbol():
    red = RedElectrica(dict.fromkeys("XABCD"), [linea("A", "B"), linea("C", "D")])
    resultado = AnalizadorRed().analizar(red)
    assert resultado["metadata"]["componentes"] == 3
    assert resultado["metadata"]["red_conectada"] is False
    assert resultado["metadata"]["origen_flujo"] != "X"
    assert AnalizadorRed().analizar(red, "A", "D")["flujo_maximo_red"] == 0


def test_capacidades_paralelas_y_sentido_inverso():
    nodos = dict.fromkeys("AB")
    aristas = [linea("A", "B", capacidad=0.25), linea("B", "A", capacidad=0.5)]
    for origen, destino in [("A", "B"), ("B", "A")]:
        flujo, corte = calcular_flujo_maximo(nodos, aristas, origen, destino)
        assert flujo == pytest.approx(0.75)
        assert len(corte) == 2


def test_capacidad_cero_no_transporta():
    assert calcular_flujo_maximo(dict.fromkeys("AB"), [linea("A", "B", capacidad=0)],
                                "A", "B")[0] == 0
