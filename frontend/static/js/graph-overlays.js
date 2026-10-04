import { px, py } from './camera.js';
import { COLOR, trazar } from './graph-draw.js';

export function dibujarMst(c) {
    const { ctx, m, now, quieto, mstInicio } = c;
    const total = m.mst.length;
    const progreso = quieto ? 1 : Math.min(1, (now - mstInicio) / 3000);
    const cantidad = Math.floor(progreso * total);

    ctx.strokeStyle = COLOR.lime; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i < cantidad; i++) trazar(c, m.mst[i]);
    ctx.stroke();

    if (cantidad < total && cantidad > 0) {
        ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 5; ctx.beginPath();
        trazar(c, m.mst[cantidad]); ctx.stroke();
    }
    return progreso >= 1 ? m.mst : null;
}

export function dibujarFlujo(c) {
    const { ctx, m, pos, now, quieto } = c;
    ctx.lineWidth = 3.5; ctx.strokeStyle = COLOR.amber;
    ctx.setLineDash([9, 7]); ctx.lineDashOffset = quieto ? 0 : -now / 35;
    ctx.beginPath();
    for (const e of m.caminos) trazar(c, e);
    ctx.stroke(); ctx.setLineDash([]);

    ctx.strokeStyle = COLOR.red; ctx.lineWidth = 3;
    for (const [a, b] of m.corte) {
        ctx.beginPath(); trazar(c, [a, b]); ctx.stroke();
        const mx = (px(pos, a) + px(pos, b)) / 2, my = (py(pos, a) + py(pos, b)) / 2;
        ctx.beginPath();
        ctx.moveTo(mx - 5, my - 5); ctx.lineTo(mx + 5, my + 5);
        ctx.moveTo(mx + 5, my - 5); ctx.lineTo(mx - 5, my + 5);
        ctx.stroke();
    }
}

export function dibujarExtremos({ ctx, m, pos }) {
    const etiqueta = (i, texto) => {
        if (i < 0) return;
        const x = px(pos, i), y = py(pos, i);
        ctx.fillStyle = COLOR.amber; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = '700 12px Archivo, sans-serif';
        const rotulo = `${texto} ${m.ids[i]}`, ancho = ctx.measureText(rotulo).width;
        ctx.fillStyle = COLOR.ink; ctx.fillRect(x + 12, y - 24, ancho + 14, 22);
        ctx.fillStyle = COLOR.amber; ctx.fillText(rotulo, x + 19, y - 9);
    };
    etiqueta(m.origen, 'ORIGEN');
    etiqueta(m.destino, 'DESTINO');
}

export function dibujarLineasFalla(c) {
    const { ctx, m, falla } = c;
    ctx.setLineDash([4, 5]); ctx.strokeStyle = COLOR.red; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const e of m.aristas) if (e[0] === falla.indice || e[1] === falla.indice) trazar(c, e);
    ctx.stroke(); ctx.setLineDash([]);

    ctx.lineWidth = 2; ctx.beginPath();
    for (const e of m.aristas) if (falla.aislados.has(e[0]) && falla.aislados.has(e[1])) trazar(c, e);
    ctx.stroke();
}

export function dibujarNodoCaido({ ctx, pos, falla, now, quieto }) {
    if (falla.indice < 0) return;
    const x = px(pos, falla.indice), y = py(pos, falla.indice);
    ctx.strokeStyle = COLOR.red; ctx.lineWidth = 4; ctx.beginPath();
    ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9);
    ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9);
    ctx.stroke();
    if (quieto) return;
    const fase = ((now - falla.inicio) % 1600) / 1600;
    ctx.globalAlpha = (1 - fase) * 0.9; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 10 + fase * 90, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha = 1;
}
