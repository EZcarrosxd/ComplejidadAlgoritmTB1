import { px, py, vista } from './camera.js';

export const COLOR = {
    well: '#FAF9F6', ink: '#2B2A25', dim: '#C9C3B5',
    lime: '#3C8F00', amber: '#E08A00', red: '#D7261E',
};

export function trazar(c, [u, v]) {
    c.ctx.moveTo(px(c.pos, u), py(c.pos, u));
    c.ctx.lineTo(px(c.pos, v), py(c.pos, v));
}

export function dibujarFondo({ ctx, w, h }) {
    ctx.fillStyle = COLOR.well;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#EEEBE4';
    for (let gx = 16; gx < w; gx += 32) for (let gy = 16; gy < h; gy += 32) ctx.fillRect(gx, gy, 1.5, 1.5);
}

export function dibujarLineas(c) {
    const { ctx, m, modo, falla } = c;
    ctx.lineWidth = 1;
    ctx.strokeStyle = modo === 'general' ? COLOR.dim : '#E0DBCF';
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
    const { ctx, m, pos, modo, falla, quieto, now } = c;
    const grande = vista.k > 1.8;

    for (let i = 0; i < pos.L; i++) {
        if (m.esCritico[i] || (falla && i === falla.indice)) continue;
        let color = modo === 'general' ? COLOR.ink : '#9A9484';
        let tam = grande ? 6 : 4.5;
        if (falla) {
            if (falla.aislados.has(i)) { color = COLOR.red; tam += 1.5; } else color = COLOR.dim;
        }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px(pos, i), py(pos, i), tam / 2, 0, 6.2832); ctx.fill();
    }

    for (let i = 0; i < pos.L; i++) {
        if (!m.esCritico[i] || (falla && i === falla.indice)) continue;
        const x = px(pos, i), y = py(pos, i), r = grande ? 7 : 5.5;
        ctx.fillStyle = falla && !falla.aislados.has(i) ? '#E8908A' : COLOR.red;
        rombo(ctx, x, y, r); ctx.fill();
        if (modo === 'fallas' && !quieto) {
            const fase = ((now / 1100) + i * 0.137) % 1;
            ctx.globalAlpha = 1 - fase; ctx.strokeStyle = COLOR.red; ctx.lineWidth = 1.5;
            rombo(ctx, x, y, r + fase * 16); ctx.stroke(); ctx.globalAlpha = 1;
        }
    }
}

export function dibujarEtiquetas({ ctx, m, pos, w, h }) {
    if (vista.k <= 1.8) return;
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#6B665A';
    for (let i = 0; i < pos.L; i++) {
        const x = px(pos, i), y = py(pos, i);
        if (x > -20 && x < w && y > 0 && y < h) ctx.fillText(m.ids[i], x + 7, y - 7);
    }
}

export function dibujarAnillos({ ctx, pos, hover, sel, modo, quieto, now }) {
    if (hover >= 0) {
        ctx.strokeStyle = COLOR.amber; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px(pos, hover), py(pos, hover), 9, 0, 6.2832); ctx.stroke();
    }
    if (sel >= 0 && (modo === 'general' || modo === 'mst')) {
        const r = 10 + (quieto ? 0 : Math.sin(now / 200) * 2);
        ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(px(pos, sel), py(pos, sel), r, 0, 6.2832); ctx.stroke();
    }
}
