import { crearPosiciones, crearVecinos } from './distribucion.js';

const PAUSA_POR_NIVEL = 0.12;

export function crearModelo(datos, previo) {
    const grafo = datos.grafo_visual;
    const ids = grafo.nodos.map((nodo) => nodo.id);
    const indices = new Map(ids.map((id, i) => [id, i]));
    const par = (a, b) => (indices.has(a) && indices.has(b) ? [indices.get(a), indices.get(b)] : null);
    const pares = (lineas) => lineas.map((l) => par(l.origen, l.destino)).filter(Boolean);
    const criticos = new Set(datos.nodos_criticos);
    const meta = datos.metadata;
    const aristas = grafo.aristas.map((a) => [indices.get(a.from), indices.get(a.to)]);
    const vecinos = crearVecinos(ids.length, aristas);
    const ordenKruskal = [...datos.aristas_mst].sort((a, b) => a.costo - b.costo);
    const costoTotal = ordenKruskal.reduce((suma, a) => suma + a.costo, 0) || 1;
    let acumulado = 0;
    const fraccionCosto = ordenKruskal.map((a) => (acumulado += a.costo) / costoTotal);

    return {
        ids,
        indices,
        grado: grafo.nodos.map((nodo) => nodo.grado),
        aristas,
        vecinos,
        esCritico: ids.map((id) => criticos.has(id)),
        mst: pares(ordenKruskal),
        fraccionCosto,
        corte: pares(datos.lineas_corte_minimo),
        caminos: datos.caminos_flujo.flatMap((camino) =>
            camino.slice(1).map((id, j) => par(camino[j], id)).filter(Boolean)),
        impacto: new Map(datos.impacto_criticos.map((x) => [x.id, x])),
        origen: indices.get(meta.origen_flujo) ?? -1,
        destino: indices.get(meta.destino_flujo) ?? -1,
        pos: crearPosiciones(ids, aristas, vecinos, previo),
    };
}

function calcularRetrasos(modelo, inicio, aislados) {
    const retraso = new Map();
    if (inicio < 0) return retraso;
    const cola = [inicio];
    const nivel = new Map([[inicio, 0]]);
    for (let k = 0; k < cola.length; k++) {
        const actual = cola[k];
        for (const vecino of modelo.vecinos[actual]) {
            if (nivel.has(vecino) || !aislados.has(vecino)) continue;
            nivel.set(vecino, nivel.get(actual) + 1);
            retraso.set(vecino, nivel.get(vecino) * PAUSA_POR_NIVEL);
            cola.push(vecino);
        }
    }
    for (const i of aislados) if (!retraso.has(i)) retraso.set(i, 0);
    return retraso;
}

export function describirFalla(modelo, id) {
    const impacto = modelo.impacto.get(id);
    const indice = modelo.indices.get(id) ?? -1;
    const aislados = new Set((impacto ? impacto.aislados_visibles : []).map((v) => modelo.indices.get(v)));
    const retraso = calcularRetrasos(modelo, indice, aislados);
    return {
        id,
        indice,
        perdidos: impacto ? impacto.nodos_aislados : 0,
        aislados,
        retraso,
        duracion: Math.max(0, ...retraso.values()),
        inicio: performance.now() / 1000,
    };
}
