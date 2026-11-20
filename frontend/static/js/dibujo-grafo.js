import { pantallaX, pantallaY, vista } from './camara.js';

export const COLOR = {
    well: '#FAF8F5', ink: '#1F1E1B', dim: '#B9B2A6',
    lime: '#3E7B3A', amber: '#A5620E', red: '#C23B2C',
};

export function trazar(c, [u, v]) {
    c.ctx.moveTo(pantallaX(c.pos, u), pantallaY(c.pos, u));
    c.ctx.lineTo(pantallaX(c.pos, v), pantallaY(c.pos, v));
}

export function dibujarFondo({ ctx, w, h }) {
    ctx.fillStyle = COLOR.well;
    ctx.fillRect(0, 0, w, h);
}

export function dibujarLineas(c) {
    const { ctx, m, modo, falla } = c;
    ctx.lineWidth = 1;
    ctx.strokeStyle = modo === 'general' ? COLOR.dim : '#DCD6CC';
    ctx.beginPath();
    for (const e of m.aristas) {
        if (falla && (e[0] === falla.indice || e[1] === falla.indice)) continue;
        trazar(c, e);
    }
    ctx.stroke();
}

function rombo(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath();
}

export function dibujarNodos(c) {
    const { ctx, m, pos, modo, falla } = c;
    const grande = vista.escala > 1.8;

    for (let i = 0; i < pos.cantidad; i++) {
        if (m.esCritico[i] || (falla && i === falla.indice)) continue;
        let color = modo === 'general' ? COLOR.ink : '#8C867C';
        let tam = grande ? 6 : 4.5;
        if (falla) {
            if (falla.aislados.has(i)) { color = COLOR.red; tam += 1.5; } else color = COLOR.dim;
        }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(pantallaX(pos, i), pantallaY(pos, i), tam / 2, 0, 6.2832); ctx.fill();
    }

    for (let i = 0; i < pos.cantidad; i++) {
        if (!m.esCritico[i] || (falla && i === falla.indice)) continue;
        const x = pantallaX(pos, i), y = pantallaY(pos, i), r = grande ? 7 : 5.5;
        ctx.fillStyle = falla && !falla.aislados.has(i) ? '#E3A097' : COLOR.red;
        rombo(ctx, x, y, r); ctx.fill();
    }
}

export function dibujarEtiquetas({ ctx, m, pos, w, h }) {
    if (vista.escala <= 1.8) return;
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#4A4740';
    for (let i = 0; i < pos.cantidad; i++) {
        const x = pantallaX(pos, i), y = pantallaY(pos, i);
        if (x > -20 && x < w && y > 0 && y < h) ctx.fillText(m.ids[i], x + 7, y - 7);
    }
}

export function dibujarAnillos({ ctx, pos, bajoPuntero, sel, modo }) {
    if (bajoPuntero >= 0) {
        ctx.strokeStyle = COLOR.amber; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pantallaX(pos, bajoPuntero), pantallaY(pos, bajoPuntero), 9, 0, 6.2832); ctx.stroke();
    }
    if (sel >= 0 && (modo === 'general' || modo === 'mst')) {
        ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(pantallaX(pos, sel), pantallaY(pos, sel), 10, 0, 6.2832); ctx.stroke();
    }
}
