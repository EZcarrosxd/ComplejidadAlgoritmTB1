import { formatoEntero, formatoMoneda, formatoNumero } from './dom.js';

const GRUPOS_NIVEL = 6;
const QUINTILES = 5;

const indice = (m, id) => m.indices.get(id) ?? -1;
const par = (m, a, b) => [indice(m, a), indice(m, b)];
const valido = ([a, b]) => a >= 0 && b >= 0;
const soles = (valor) => `S/ ${formatoMoneda.format(valor)}`;

function mezclarColores(desde, hasta, t) {
    const a = parseInt(desde.slice(1), 16), b = parseInt(hasta.slice(1), 16);
    const canal = (desplazamiento) => {
        const x = (a >> desplazamiento) & 255, y = (b >> desplazamiento) & 255;
        return Math.round(x + (y - x) * t);
    };
    return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`;
}

function gradiente(desde, hasta, cantidad) {
    return Array.from({ length: cantidad }, (_, i) => mezclarColores(desde, hasta, cantidad > 1 ? i / (cantidad - 1) : 0));
}

function capaVacia() {
    return { aristas: [], nodos: [], foco: null };
}

function capaBfs(d, m, k) {
    const { pasos, nivel_maximo: maximo } = d.algoritmos.bfs;
    const cantidad = k ?? pasos.length;
    const colores = gradiente('#1F4E66', '#A9CBDB', GRUPOS_NIVEL);
    const grupos = colores.map((color) => ({ indices: [], color, radio: 1.5 }));
    for (const [id, nivel] of pasos.slice(0, cantidad)) {
        const grupo = Math.min(GRUPOS_NIVEL - 1, Math.floor(nivel / Math.max(maximo, 1) * GRUPOS_NIVEL));
        grupos[grupo].indices.push(indice(m, id));
    }
    const capa = capaVacia();
    capa.nodos = grupos;
    if (cantidad > 0) capa.foco = { nodo: indice(m, pasos[cantidad - 1][0]) };
    return capa;
}

function capaDfs(d, m, k) {
    const { pasos, criticos } = d.algoritmos.dfs;
    const esCritico = new Set(criticos);
    const visitados = pasos.slice(0, k);
    const capa = capaVacia();
    capa.nodos = [
        { indices: visitados.map((id) => indice(m, id)), color: '#4A4740', radio: 0.5 },
        { indices: visitados.filter((id) => esCritico.has(id)).map((id) => indice(m, id)), color: '#C23B2C', radio: 3 },
    ];
    if (k > 0) capa.foco = { nodo: indice(m, pasos[k - 1]) };
    return capa;
}

function capaUnionFind(d, m, k) {
    const { pasos } = d.algoritmos.union_find;
    const cantidad = k ?? pasos.length;
    const unidas = [], repetidas = [];
    for (const [a, b, une] of pasos.slice(0, cantidad)) (une ? unidas : repetidas).push(par(m, a, b));
    const capa = capaVacia();
    capa.aristas = [
        { pares: repetidas.filter(valido), color: '#CFC8BC', grosor: 1 },
        { pares: unidas.filter(valido), color: '#7A5C99', grosor: 2 },
    ];
    if (k > 0) capa.foco = { par: par(m, pasos[k - 1][0], pasos[k - 1][1]) };
    return capa;
}

function capaKruskal(d, m, k) {
    const { pasos } = d.algoritmos.kruskal;
    const aceptadas = [], descartadas = [];
    for (const [a, b, acepta] of pasos.slice(0, k)) (acepta ? aceptadas : descartadas).push(par(m, a, b));
    const capa = capaVacia();
    capa.aristas = [
        { pares: descartadas.filter(valido), color: '#E3A097', grosor: 1 },
        { pares: aceptadas.filter(valido), color: '#3E7B3A', grosor: 2.5 },
    ];
    if (k > 0) capa.foco = { par: par(m, pasos[k - 1][0], pasos[k - 1][1]) };
    return capa;
}

function capaPrim(d, m, k) {
    const { pasos, inicio } = d.algoritmos.prim;
    const cantidad = k ?? pasos.length;
    const capa = capaVacia();
    capa.aristas = [{ pares: pasos.slice(0, cantidad).map(([a, b]) => par(m, a, b)).filter(valido), color: '#2F7F6F', grosor: 2.5 }];
    capa.nodos = [{ indices: [indice(m, inicio)], color: '#2F7F6F', radio: 4 }];
    if (cantidad > 0 && k !== null) capa.foco = { par: par(m, pasos[cantidad - 1][0], pasos[cantidad - 1][1]) };
    return capa;
}

const repeticionMerge = { datos: null, k: 0, orden: null };

export function ordenMergeSort(d, k) {
    const { costos, pasos } = d.algoritmos.merge_sort;
    if (repeticionMerge.datos !== d || k < repeticionMerge.k) {
        repeticionMerge.datos = d;
        repeticionMerge.k = 0;
        repeticionMerge.orden = costos.map((_, i) => i);
    }
    const orden = repeticionMerge.orden;
    for (let paso = repeticionMerge.k; paso < k; paso++) {
        const [inicio, medio, fin] = pasos[paso];
        const izquierda = orden.slice(inicio, medio), derecha = orden.slice(medio, fin);
        let i = 0, j = 0, destino = inicio;
        while (i < izquierda.length && j < derecha.length) {
            orden[destino++] = costos[izquierda[i]] <= costos[derecha[j]] ? izquierda[i++] : derecha[j++];
        }
        while (i < izquierda.length) orden[destino++] = izquierda[i++];
        while (j < derecha.length) orden[destino++] = derecha[j++];
    }
    repeticionMerge.k = k;
    return orden;
}

function capaMergeSort(d, m, k) {
    const { costos, pasos } = d.algoritmos.merge_sort;
    const capa = capaVacia();
    if (k === null) {
        const ordenados = costos.map((costo, i) => [costo, i]).sort((a, b) => a[0] - b[0]);
        const colores = gradiente('#E9DCC4', '#6E4F1E', QUINTILES);
        capa.aristas = colores.map((color, q) => ({
            pares: ordenados.slice(Math.floor(q * ordenados.length / QUINTILES), Math.floor((q + 1) * ordenados.length / QUINTILES))
                .map(([, i]) => m.aristas[i]).filter(Boolean),
            color, grosor: 1.2 + q * 0.5,
        }));
        return capa;
    }
    const orden = ordenMergeSort(d, k);
    if (k > 0) {
        const [inicio, , fin] = pasos[k - 1];
        capa.aristas = [{ pares: orden.slice(inicio, fin).map((i) => m.aristas[i]).filter(Boolean), color: '#8A6D3B', grosor: 3 }];
    }
    return capa;
}

function capaFlujo(d, m, k) {
    const caminos = d.caminos_flujo;
    const aPares = (camino) => camino.slice(1).map((id, j) => par(m, camino[j], id)).filter(valido);
    const capa = capaVacia();
    capa.aristas = [
        { pares: caminos.slice(0, Math.max(0, k - 1)).flatMap(aPares), color: '#D9A35C', grosor: 2 },
        { pares: k > 0 ? aPares(caminos[k - 1]) : [], color: '#A5620E', grosor: 4.5 },
    ];
    capa.nodos = [{ indices: [m.origen, m.destino].filter((i) => i >= 0), color: '#A5620E', radio: 4 }];
    return capa;
}

function capaBellmanFord(d, m, k) {
    const { pasos, camino, origen, destino } = d.algoritmos.bellman_ford;
    const capa = capaVacia();
    capa.nodos = [{ indices: [indice(m, origen), indice(m, destino)], color: '#9C4F2E', radio: 4 }];
    if (k === null) {
        capa.aristas = [{ pares: camino.slice(1).map((id, j) => par(m, camino[j], id)).filter(valido), color: '#9C4F2E', grosor: 4.5 }];
        return capa;
    }
    capa.aristas = [{ pares: pasos.slice(0, k).map(([, a, b]) => par(m, a, b)).filter(valido), color: '#C98B6E', grosor: 1.4 }];
    if (k > 0) capa.foco = { par: par(m, pasos[k - 1][1], pasos[k - 1][2]) };
    return capa;
}

function capaFloydWarshall(d, m, k) {
    const { nodos, aristas, pasos } = d.algoritmos.floyd_warshall;
    const capa = capaVacia();
    capa.aristas = [{ pares: aristas.map(([a, b]) => par(m, a, b)).filter(valido), color: '#4F5FA8', grosor: 2.5 }];
    const procesados = k === null ? nodos.length : k;
    capa.nodos = [
        { indices: nodos.map((id) => indice(m, id)), color: '#B7BEE0', radio: 2 },
        { indices: pasos.slice(0, procesados).map(([id]) => indice(m, id)), color: '#4F5FA8', radio: 2.5 },
    ];
    if (k > 0) capa.foco = { nodo: indice(m, pasos[k - 1][0]) };
    return capa;
}

function capaRefuerzo(d, m, elegidos) {
    const elegidosSet = new Set(elegidos);
    const protegidos = d.impacto_criticos.filter((x) => elegidosSet.has(x.id)).flatMap((x) => x.aislados_visibles);
    const capa = capaVacia();
    capa.nodos = [
        { indices: protegidos.map((id) => indice(m, id)), color: '#E2C77A', radio: 1 },
        { indices: d.nodos_criticos.filter((id) => !elegidosSet.has(id)).map((id) => indice(m, id)), color: '#C23B2C', radio: 3 },
        { indices: elegidos.map((id) => indice(m, id)), color: '#A07A12', radio: 4.5 },
    ];
    return capa;
}

function capaMochila(d, m, k) {
    const { items, elegidos } = d.algoritmos.mochila;
    if (k === null) return capaRefuerzo(d, m, elegidos);
    const capa = capaVacia();
    capa.nodos = [{ indices: items.slice(0, k).map((item) => indice(m, item.id)), color: '#A07A12', radio: 3 }];
    if (k > 0) capa.foco = { nodo: indice(m, items[k - 1].id) };
    return capa;
}

function capaBacktracking(d, m, k) {
    const { pasos, elegidos } = d.algoritmos.backtracking;
    if (k === null) return capaRefuerzo(d, m, elegidos);
    const capa = capaVacia();
    const probados = pasos.slice(0, k).map(([, id]) => id).filter(Boolean);
    capa.nodos = [{ indices: probados.map((id) => indice(m, id)), color: '#8C4A68', radio: 3 }];
    const actual = k > 0 ? pasos[k - 1][1] : null;
    if (actual) capa.foco = { nodo: indice(m, actual) };
    return capa;
}

export const CATALOGO = [
    {
        id: 'general', nombre: 'Mapa', tecnica: 'Red completa', color: '#1F1E1B', complejidad: 'O(V + E)',
        problema: 'Arrastra para moverte y haz clic en un punto para ver sus datos', leyenda: 'Línea',
        valor: (d) => `${formatoEntero.format(d.metadata.total_nodos)} puntos`,
        pasos: () => [],
    },
    {
        id: 'bfs', nombre: 'BFS', tecnica: 'Recorrido en grafos', color: '#2F6F8F', complejidad: 'O(V + E)',
        problema: 'Hasta dónde llega la energía desde el origen, nivel por nivel', leyenda: 'Nivel de alcance',
        valor: (d) => `${d.algoritmos.bfs.nivel_maximo} niveles`,
        pasos: (d) => d.algoritmos.bfs.pasos,
        capa: capaBfs,
        textoPaso: ([id, nivel]) => `Visita ${id} en el nivel ${nivel}`,
    },
    {
        id: 'fallas', nombre: 'DFS de Tarjan', tecnica: 'Recorrido en grafos', color: '#C23B2C', complejidad: 'O(V + E)',
        problema: 'Haz clic en un punto para ver qué pasa si falla', leyenda: 'Zona sin luz',
        valor: (d) => `${formatoEntero.format(d.nodos_criticos.length)} débiles`,
        pasos: (d) => d.algoritmos.dfs.pasos,
        capa: capaDfs,
        textoPaso: (id, d) => (d.algoritmos.dfs.criticos.includes(id) ? `Descubre ${id}, un punto débil` : `Descubre ${id}`),
    },
    {
        id: 'union_find', nombre: 'Union-Find', tecnica: 'UFDS', color: '#7A5C99', complejidad: 'O(E α(V))',
        problema: 'Cómo se unen las zonas al agregar cada línea', leyenda: 'Línea que une zonas',
        valor: (d) => `${d.algoritmos.union_find.componentes} ${d.algoritmos.union_find.componentes === 1 ? 'grupo' : 'grupos'}`,
        pasos: (d) => d.algoritmos.union_find.pasos,
        capa: capaUnionFind,
        textoPaso: ([a, b, une]) => (une ? `Une ${a} con ${b}` : `${a} y ${b} ya estaban unidos`),
    },
    {
        id: 'mst', nombre: 'Kruskal', tecnica: 'MST', color: '#3E7B3A', complejidad: 'O(E log E)',
        problema: 'En verde, el cableado más barato que conecta toda la red', leyenda: 'Cableado más barato',
        valor: (d) => soles(d.costo_minimo_instalacion),
        pasos: (d) => d.algoritmos.kruskal.pasos,
        capa: capaKruskal,
        textoPaso: ([a, b, acepta]) => (acepta ? `Acepta la línea ${a} con ${b}` : `Descarta ${a} con ${b} porque forma un ciclo`),
    },
    {
        id: 'prim', nombre: 'Prim', tecnica: 'MST', color: '#2F7F6F', complejidad: 'O(E log V)',
        problema: 'El mismo cableado mínimo, creciendo desde un solo punto', leyenda: 'Árbol de Prim',
        valor: (d) => soles(d.algoritmos.prim.costo),
        pasos: (d) => d.algoritmos.prim.pasos,
        capa: capaPrim,
        textoPaso: ([a, b]) => `Agrega ${b} desde ${a}`,
    },
    {
        id: 'merge_sort', nombre: 'Merge Sort', tecnica: 'Divide y vencerás', color: '#8A6D3B', complejidad: 'O(E log E)',
        problema: 'Ordena las líneas por costo antes de Kruskal\nMás oscuro es más caro', leyenda: 'Costo de la línea',
        valor: (d) => `${formatoEntero.format(d.algoritmos.merge_sort.pasos.length)} mezclas`,
        pasos: (d) => d.algoritmos.merge_sort.pasos,
        capa: capaMergeSort,
        textoPaso: ([inicio, medio, fin]) => `Mezcla ${formatoEntero.format(medio - inicio)} y ${formatoEntero.format(fin - medio)} líneas ya ordenadas`,
    },
    {
        id: 'flujo', nombre: 'Edmonds-Karp', tecnica: 'Flujo máximo', color: '#A5620E', complejidad: 'O(V E²)',
        problema: 'Haz clic en dos puntos para medir la capacidad entre ellos', leyenda: 'Corriente',
        valor: (d) => `${formatoNumero.format(d.flujo_maximo_red)} A`,
        pasos: (d) => d.caminos_flujo,
        capa: capaFlujo,
        textoPaso: (camino, d, k) => `Camino de aumento ${k} con ${camino.length - 1} líneas`,
    },
    {
        id: 'bellman_ford', nombre: 'Bellman-Ford', tecnica: 'Rutas mínimas', color: '#9C4F2E', complejidad: 'O(V E)',
        problema: 'La ruta de menor costo entre el origen y el destino', leyenda: 'Ruta de menor costo',
        valor: (d) => soles(d.algoritmos.bellman_ford.costo),
        pasos: (d) => d.algoritmos.bellman_ford.pasos,
        capa: capaBellmanFord,
        textoPaso: ([iteracion, a, b]) => `Iteración ${iteracion}: mejora ${b} pasando por ${a}`,
    },
    {
        id: 'floyd_warshall', nombre: 'Floyd-Warshall', tecnica: 'Rutas mínimas', color: '#4F5FA8', complejidad: 'O(V³)',
        problema: 'Distancias entre todos los puntos de la zona del origen', leyenda: 'Zona analizada',
        valor: (d) => `${d.algoritmos.floyd_warshall.nodos.length} × ${d.algoritmos.floyd_warshall.nodos.length}`,
        pasos: (d) => d.algoritmos.floyd_warshall.pasos,
        capa: capaFloydWarshall,
        textoPaso: ([id, mejoras]) => `Pasa por ${id} y mejora ${mejoras} distancias`,
    },
    {
        id: 'mochila', nombre: 'Mochila 0/1', tecnica: 'Programación dinámica', color: '#A07A12', complejidad: 'O(n × P)',
        problema: 'Qué puntos débiles reforzar con el presupuesto disponible', leyenda: 'Punto reforzado',
        valor: (d) => `${formatoEntero.format(d.algoritmos.mochila.valor)} protegidos`,
        pasos: (d) => d.algoritmos.mochila.items,
        capa: capaMochila,
        textoPaso: (item) => `Decide si reforzar ${item.id} por ${soles(item.costo)}`,
    },
    {
        id: 'backtracking', nombre: 'Backtracking', tecnica: 'Fuerza bruta y backtracking', color: '#8C4A68', complejidad: 'O(2ⁿ) con poda',
        problema: 'El mismo refuerzo explorando combinaciones y podando las que no mejoran', leyenda: 'Punto reforzado',
        valor: (d) => `${formatoEntero.format(d.algoritmos.backtracking.explorados)} nodos`,
        pasos: (d) => d.algoritmos.backtracking.pasos,
        capa: capaBacktracking,
        textoPaso: ([profundidad, id]) => (id ? `Nivel ${profundidad}: prueba reforzar ${id}` : `Nivel ${profundidad}: poda la rama`),
    },
];

export const ALGORITMOS = new Map(CATALOGO.map((a) => [a.id, a]));

const MODOS_CON_DIBUJO_PROPIO = new Set(['general', 'mst', 'flujo', 'fallas']);

export function crearCapa(datos, modelo, modo, paso) {
    const algoritmo = ALGORITMOS.get(modo);
    if (!algoritmo?.capa || !datos?.algoritmos) return null;
    if (paso === null && MODOS_CON_DIBUJO_PROPIO.has(modo)) return null;
    return algoritmo.capa(datos, modelo, paso);
}
