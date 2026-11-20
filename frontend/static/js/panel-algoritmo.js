import { $ } from './dom.js';
import { suscribir, toca } from './estado.js';
import { ordenMergeSort } from './algoritmos.js';

const ALTO_VISTA = 112;
const FONDO = '#FAF8F5';
const TEXTO = '#6B665E';
function prepararLienzo() {
    const lienzo = $('vista-extra');
    const ancho = lienzo.clientWidth || 320;
    const escala = window.devicePixelRatio || 1;
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(ALTO_VISTA * escala);
    const ctx = lienzo.getContext('2d');
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.fillStyle = FONDO;
    ctx.fillRect(0, 0, ancho, ALTO_VISTA);
    ctx.font = '500 10px Inter, sans-serif';
    return { ctx, ancho, alto: ALTO_VISTA };
}

function columnas({ ctx, ancho, alto }, valores, colorDe, etiqueta) {
    const maximo = Math.max(...valores, 1);
    const base = alto - 16;
    const anchoColumna = ancho / valores.length;
    valores.forEach((valor, i) => {
        const altura = (valor / maximo) * (base - 8);
        ctx.fillStyle = colorDe(i);
        ctx.fillRect(i * anchoColumna, base - altura, Math.max(anchoColumna - (anchoColumna > 3 ? 1 : 0), 0.6), altura);
    });
    ctx.fillStyle = TEXTO;
    ctx.fillText(etiqueta, 0, alto - 3);
}

function vistaBfs(lienzo, a, paso) {
    const porNivel = new Array(a.nivel_maximo + 1).fill(0);
    a.pasos.forEach(([, nivel]) => porNivel[nivel]++);
    const nivelActual = paso === null ? Infinity : (a.pasos[Math.max(0, paso - 1)]?.[1] ?? 0);
    columnas(lienzo, porNivel, (i) => (i <= nivelActual ? '#2F6F8F' : '#D5E3EA'), 'Puntos por nivel');
}

function vistaUnionFind({ ctx, ancho, alto }, a, paso) {
    const total = a.pasos.length;
    const inicial = a.componentes + a.pasos.filter((p) => p[2]).length;
    let grupos = inicial;
    const base = alto - 16;
    ctx.strokeStyle = '#7A5C99'; ctx.lineWidth = 1.5; ctx.beginPath();
    a.pasos.forEach(([, , une], i) => {
        if (une) grupos--;
        const x = (i / total) * ancho, y = base - (grupos / inicial) * (base - 8);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    if (paso !== null) {
        ctx.fillStyle = '#7A5C99';
        ctx.fillRect((paso / total) * ancho - 1, 4, 2, base - 4);
    }
    ctx.fillStyle = TEXTO;
    ctx.fillText('Grupos separados mientras se agregan líneas', 0, alto - 3);
}

function vistaMergeSort({ ctx, ancho, alto }, a, paso) {
    const orden = paso === null ? [...a.costos.keys()].sort((x, y) => a.costos[x] - a.costos[y]) : ordenMergeSort(a.__datos, paso);
    const maximo = Math.max(...a.costos);
    const base = alto - 16;
    const rango = paso > 0 ? a.pasos[paso - 1] : null;
    for (let x = 0; x < ancho; x++) {
        const posicion = Math.floor((x / ancho) * orden.length);
        const altura = (a.costos[orden[posicion]] / maximo) * (base - 8);
        const dentro = rango && posicion >= rango[0] && posicion < rango[2];
        ctx.fillStyle = dentro ? '#8A6D3B' : '#D9CBB0';
        ctx.fillRect(x, base - altura, 1, altura);
    }
    ctx.fillStyle = TEXTO;
    ctx.fillText('Costo de cada línea en su posición actual', 0, alto - 3);
}

function vistaBellmanFord(lienzo, a, paso) {
    const porIteracion = new Array(a.iteraciones).fill(0);
    a.pasos.forEach(([iteracion]) => porIteracion[iteracion - 1]++);
    const actual = paso === null ? Infinity : (a.pasos[Math.max(0, paso - 1)]?.[0] ?? 0);
    columnas(lienzo, porIteracion, (i) => (i + 1 <= actual ? '#9C4F2E' : '#E8D2C6'), 'Mejoras por iteración');
}

function vistaFloydWarshall({ ctx, ancho, alto }, a, paso) {
    const n = a.nodos.length;
    const lado = Math.min(alto - 6, ancho) / n;
    const valores = a.matriz.flat().filter((v) => v !== null);
    const maximo = Math.max(...valores, 1);
    const actual = paso > 0 ? paso - 1 : -1;
    a.matriz.forEach((fila, i) => fila.forEach((valor, j) => {
        const t = valor === null ? 1 : valor / maximo;
        const tono = Math.round(70 + t * 160);
        ctx.fillStyle = valor === null ? '#EFEBE4' : `rgb(${tono - 20}, ${tono - 10}, ${Math.min(255, tono + 40)})`;
        ctx.fillRect(j * lado, i * lado, lado - 0.5, lado - 0.5);
    }));
    if (actual >= 0) {
        ctx.strokeStyle = '#1F1E1B'; ctx.lineWidth = 1.5;
        ctx.strokeRect(0, actual * lado, n * lado, lado);
        ctx.strokeRect(actual * lado, 0, lado, n * lado);
    }
    ctx.fillStyle = TEXTO;
    ctx.fillText('Matriz de distancias', n * lado + 10, 12);
    ctx.fillText('Más oscuro es más cerca', n * lado + 10, 26);
}

function vistaMochila({ ctx, ancho, alto }, a, paso) {
    const filas = a.tabla.length, cols = a.tabla[0].length;
    const maximo = Math.max(...a.tabla[filas - 1], 1);
    const alturaFila = (alto - 16) / filas, anchoCol = ancho / cols;
    const visibles = paso === null ? filas : paso + 1;
    a.tabla.forEach((fila, i) => fila.forEach((valor, j) => {
        const t = valor / maximo;
        ctx.globalAlpha = i < visibles ? 1 : 0.15;
        ctx.fillStyle = `rgb(${Math.round(245 - t * 85)}, ${Math.round(236 - t * 114)}, ${Math.round(214 - t * 196)})`;
        ctx.fillRect(j * anchoCol, i * alturaFila, anchoCol - 0.5, alturaFila - 0.5);
    }));
    ctx.globalAlpha = 1;
    ctx.fillStyle = TEXTO;
    ctx.fillText('Tabla de programación dinámica por presupuesto', 0, alto - 3);
}

function vistaBacktracking({ ctx, ancho, alto }, a) {
    const filas = [['Fuerza bruta', a.combinaciones ?? 0], ['Backtracking', a.explorados], ['Podas', a.podados]];
    const maximo = Math.log10(Math.max(...filas.map(([, v]) => v), 10));
    const alturaFila = (alto - 16) / filas.length;
    filas.forEach(([nombre, valor], i) => {
        const largo = (Math.log10(Math.max(valor, 1)) / maximo) * (ancho - 120);
        ctx.fillStyle = i === 0 ? '#D9C3CE' : '#8C4A68';
        ctx.fillRect(110, i * alturaFila + 6, Math.max(largo, 2), alturaFila - 12);
        ctx.fillStyle = TEXTO;
        ctx.fillText(nombre, 0, i * alturaFila + alturaFila / 2 + 3);
    });
    ctx.fillText('Escala logarítmica', 0, alto - 3);
}

const VISTAS = {
    bfs: vistaBfs, union_find: vistaUnionFind, merge_sort: vistaMergeSort, bellman_ford: vistaBellmanFord,
    floyd_warshall: vistaFloydWarshall, mochila: vistaMochila, backtracking: vistaBacktracking,
};

function pintarVista(s) {
    const vista = VISTAS[s.modo];
    $('vista-extra').hidden = !vista || s.paso === null;
    if ($('vista-extra').hidden) return;
    const algoritmo = { ...s.datos.algoritmos[s.modo], __datos: s.datos };
    vista(prepararLienzo(), algoritmo, s.paso);
}

suscribir((s, cambios) => {
    if (s.datos && toca(cambios, 'modo', 'datos', 'paso')) pintarVista(s);
});
