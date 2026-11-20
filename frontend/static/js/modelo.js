import { asentar, crearPosiciones } from './distribucion.js';

export function crearModelo(datos, previo) {
    const grafo = datos.grafo_visual;
    const ids = grafo.nodos.map((nodo) => nodo.id);
    const indices = new Map(ids.map((id, i) => [id, i]));
    const par = (a, b) => (indices.has(a) && indices.has(b) ? [indices.get(a), indices.get(b)] : null);
    const pares = (lineas) => lineas.map((l) => par(l.origen, l.destino)).filter(Boolean);
    const criticos = new Set(datos.nodos_criticos);
    const meta = datos.metadata;
    const aristas = grafo.aristas.map((a) => [indices.get(a.from), indices.get(a.to)]);
    const pos = crearPosiciones(ids, previo);
    asentar(pos, aristas);

    return {
        ids,
        indices,
        grado: grafo.nodos.map((nodo) => nodo.grado),
        aristas,
        esCritico: ids.map((id) => criticos.has(id)),
        mst: pares(datos.aristas_mst),
        corte: pares(datos.lineas_corte_minimo),
        caminos: datos.caminos_flujo.flatMap((camino) =>
            camino.slice(1).map((id, j) => par(camino[j], id)).filter(Boolean)),
        impacto: new Map(datos.impacto_criticos.map((x) => [x.id, x])),
        origen: indices.get(meta.origen_flujo) ?? -1,
        destino: indices.get(meta.destino_flujo) ?? -1,
        pos,
    };
}

export function describirFalla(modelo, id) {
    const impacto = modelo.impacto.get(id);
    const aislados = new Set((impacto ? impacto.aislados_visibles : []).map((v) => modelo.indices.get(v)));
    return {
        id,
        indice: modelo.indices.get(id) ?? -1,
        perdidos: impacto ? impacto.nodos_aislados : 0,
        aislados,
    };
}
