import { crearPosiciones } from './layout.js';

// Traduce la respuesta del backend a índices del subgrafo visible para dibujarla.
export function crearModelo(datos, previo) {
    const grafo = datos.grafo_visual;
    const ids = grafo.nodos.map((nodo) => nodo.id);
    const idx = new Map(ids.map((id, i) => [id, i]));
    const par = (a, b) => (idx.has(a) && idx.has(b) ? [idx.get(a), idx.get(b)] : null);
    const pares = (lineas) => lineas.map((l) => par(l.origen, l.destino)).filter(Boolean);
    const criticos = new Set(datos.nodos_criticos);
    const meta = datos.metadata;

    return {
        ids,
        idx,
        grado: grafo.nodos.map((nodo) => nodo.grado),
        aristas: grafo.aristas.map((a) => [idx.get(a.from), idx.get(a.to)]),
        esCritico: ids.map((id) => criticos.has(id)),
        mst: pares(datos.aristas_mst),
        corte: pares(datos.lineas_corte_minimo),
        caminos: datos.caminos_flujo.flatMap((camino) =>
            camino.slice(1).map((id, j) => par(camino[j], id)).filter(Boolean)),
        impacto: new Map(datos.impacto_criticos.map((x) => [x.id, x])),
        origen: idx.get(meta.origen_flujo) ?? -1,
        destino: idx.get(meta.destino_flujo) ?? -1,
        pos: crearPosiciones(ids, previo),
    };
}

export function describirFalla(modelo, id) {
    const impacto = modelo.impacto.get(id);
    const aislados = new Set((impacto ? impacto.aislados_visibles : []).map((v) => modelo.idx.get(v)));
    return {
        id,
        indice: modelo.idx.get(id) ?? -1,
        perdidos: impacto ? impacto.nodos_aislados : 0,
        aislados,
        inicio: performance.now(),
    };
}
