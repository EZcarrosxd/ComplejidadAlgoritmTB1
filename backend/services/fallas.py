from collections import Counter

from backend.algorithms.componentes import separar_componentes

AISLADOS_EN_SEMILLA = 5


def medir_impacto(red, criticos):
    base, _ = separar_componentes(red.adyacencia)
    impacto = []

    for nodo in criticos:
        propios = [v for v in red.nodos if v != nodo and base[v] == base[nodo]]
        componente, _ = separar_componentes(red.adyacencia, nodo)
        piezas = Counter(componente[v] for v in propios)
        mayor = max(piezas, key=piezas.get)
        impacto.append({"id": nodo, "aislados": [v for v in propios if componente[v] != mayor]})

    return sorted(impacto, key=lambda x: (-len(x["aislados"]), x["id"]))


def semillas_de_impacto(impacto):
    return [x["id"] for x in impacto] + [
        v for x in impacto for v in x["aislados"][:AISLADOS_EN_SEMILLA]
    ]


def resumir_impacto(impacto, visibles):
    return [
        {
            "id": x["id"],
            "nodos_aislados": len(x["aislados"]),
            "aislados_visibles": [v for v in x["aislados"] if v in visibles],
        }
        for x in impacto
    ]
