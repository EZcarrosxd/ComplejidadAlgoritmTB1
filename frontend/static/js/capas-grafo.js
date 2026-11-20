import { pantallaX, pantallaY } from './camara.js';
import { COLOR, radioNodo, trazar } from './dibujo-grafo.js';

const PARTICULAS_POR_TRAMO = 2;
const VELOCIDAD_CORRIENTE = 0.9;
const ARISTAS_RECIENTES = 25;
const DURACION_ONDA = 1.6;

export const aristasKruskal = (c) => Math.floor(c.m.mst.length * c.kruskal);

export function dibujarMst(c) {
    const { ctx, m } = c;
    const cantidad = aristasKruskal(c);
    ctx.lineCap = 'round';
    ctx.strokeStyle = COLOR.lime; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let k = 0; k < cantidad; k++) trazar(c, m.mst[k]);
    ctx.stroke();
}

export function dibujarMstReciente(c) {
    const { ctx, m, kruskal } = c;
    const cantidad = aristasKruskal(c);
    if (kruskal >= 1) return;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(92, 190, 86, .55)'; ctx.lineWidth = 6; ctx.beginPath();
    for (let k = Math.max(0, cantidad - ARISTAS_RECIENTES); k < cantidad; k++) trazar(c, m.mst[k]);
    ctx.stroke();
}

export function dibujarFlujo(c) {
    const { ctx, m, pos } = c;
    ctx.lineCap = 'round';
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(217, 138, 28, .22)';
    ctx.beginPath();
    for (const e of m.caminos) trazar(c, e);
    ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = COLOR.amber;
    ctx.stroke();

    ctx.strokeStyle = COLOR.red; ctx.lineWidth = 3;
    for (const [a, b] of m.corte) {
        ctx.beginPath(); trazar(c, [a, b]); ctx.stroke();
        const mx = (pantallaX(pos, a) + pantallaX(pos, b)) / 2, my = (pantallaY(pos, a) + pantallaY(pos, b)) / 2;
        ctx.beginPath();
        ctx.moveTo(mx - 5, my - 5); ctx.lineTo(mx + 5, my + 5);
        ctx.moveTo(mx + 5, my - 5); ctx.lineTo(mx - 5, my + 5);
        ctx.stroke();
    }
}

export function dibujarParticulas(c) {
    const { ctx, m, pos, t } = c;
    ctx.fillStyle = '#F2A23A';
    ctx.beginPath();
    for (const [a, b] of m.caminos) {
        const ax = pantallaX(pos, a), ay = pantallaY(pos, a), bx = pantallaX(pos, b), by = pantallaY(pos, b);
        for (let p = 0; p < PARTICULAS_POR_TRAMO; p++) {
            const avance = (t * VELOCIDAD_CORRIENTE + p / PARTICULAS_POR_TRAMO) % 1;
            const x = ax + (bx - ax) * avance, y = ay + (by - ay) * avance;
            ctx.moveTo(x + 3, y);
            ctx.arc(x, y, 3, 0, Math.PI * 2);
        }
    }
    ctx.fill();
}

export function dibujarExtremos({ ctx, m, pos, w }) {
    const etiqueta = (i, texto) => {
        if (i < 0) return;
        const x = pantallaX(pos, i), y = pantallaY(pos, i);
        ctx.fillStyle = COLOR.amber; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = '700 12px Inter, sans-serif';
        const rotulo = `${texto} ${m.ids[i]}`, ancho = ctx.measureText(rotulo).width;
        const inicio = x + 12 + ancho + 14 > w ? x - 12 - ancho - 14 : x + 12;
        ctx.fillStyle = COLOR.ink; ctx.fillRect(inicio, y - 24, ancho + 14, 22);
        ctx.fillStyle = '#FFFFFF'; ctx.fillText(rotulo, inicio + 7, y - 9);
    };
    etiqueta(m.origen, 'ORIGEN');
    etiqueta(m.destino, 'DESTINO');
}

export function dibujarLineasFalla(c) {
    const { ctx, m, falla } = c;
    ctx.setLineDash([4, 5]); ctx.strokeStyle = COLOR.red; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const e of m.aristas) if (e[0] === falla.indice || e[1] === falla.indice) trazar(c, e);
    ctx.stroke(); ctx.setLineDash([]);
}

export function dibujarOndas(c) {
    const { ctx, pos, falla, t } = c;
    if (falla.indice < 0 || falla.perdidos === 0) return;
    const x = pantallaX(pos, falla.indice), y = pantallaY(pos, falla.indice);
    for (let onda = 0; onda < 2; onda++) {
        const fase = ((t - falla.inicio) / DURACION_ONDA + onda / 2) % 1;
        ctx.strokeStyle = `rgba(194, 59, 44, ${0.45 * (1 - fase)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 10 + fase * 90, 0, Math.PI * 2); ctx.stroke();
    }
}

export function dibujarNodoCaido(c) {
    const { ctx, pos, falla } = c;
    if (falla.indice < 0) return;
    const x = pantallaX(pos, falla.indice), y = pantallaY(pos, falla.indice);
    ctx.strokeStyle = COLOR.red; ctx.lineWidth = 4; ctx.beginPath();
    ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9);
    ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9);
    ctx.stroke();
}

export function dibujarCapaAristas(c) {
    const { ctx, capa } = c;
    ctx.lineCap = 'round';
    for (const grupo of capa.aristas) {
        if (!grupo.pares.length) continue;
        ctx.strokeStyle = grupo.color; ctx.lineWidth = grupo.grosor;
        ctx.beginPath();
        for (const e of grupo.pares) trazar(c, e);
        ctx.stroke();
    }
    if (!capa.foco?.par) return;
    ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 6;
    ctx.beginPath(); trazar(c, capa.foco.par); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5;
    ctx.beginPath(); trazar(c, capa.foco.par); ctx.stroke();
}

export function dibujarCapaNodos(c) {
    const { ctx, capa, pos, m, t } = c;
    for (const grupo of capa.nodos) {
        if (!grupo.indices.length) continue;
        ctx.fillStyle = grupo.color;
        ctx.beginPath();
        for (const i of grupo.indices) {
            if (i < 0) continue;
            const x = pantallaX(pos, i), y = pantallaY(pos, i), r = radioNodo(m, i) + grupo.radio;
            ctx.moveTo(x + r, y);
            ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
    }
    const nodo = capa.foco?.nodo;
    if (nodo === undefined || nodo < 0) return;
    const x = pantallaX(pos, nodo), y = pantallaY(pos, nodo);
    const r = radioNodo(m, nodo) + 7 + Math.sin(t * 6) * 1.5;
    ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}
