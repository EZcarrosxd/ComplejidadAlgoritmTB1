import { $ } from './dom.js';
import { estado } from './state.js';

const lienzo = $('hero-fx');
const G = 24, R = 120, AMBAR = '224,138,0';
let raton = null, rastro = [], ondas = [];

const heroe = () => $('inicio');
const dentro = (y) => { const r = heroe().getBoundingClientRect(); return y >= r.top && y <= r.bottom; };
const rgba = (a) => `rgba(${AMBAR},${a.toFixed(3)})`;

function cuadricula(ctx, ox, oy) {
    const c0 = Math.floor((raton.x - R - ox) / G), c1 = Math.ceil((raton.x + R - ox) / G);
    const r0 = Math.floor((raton.y - R - oy) / G), r1 = Math.ceil((raton.y + R - oy) / G);
    ctx.lineWidth = 1;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = c * G + 0.5 + ox, y = r * G + 0.5 + oy;
        const dh = Math.hypot(x + G / 2 - raton.x, y - raton.y), dv = Math.hypot(x - raton.x, y + G / 2 - raton.y);
        if (dh < R) { ctx.strokeStyle = rgba(Math.pow(1 - dh / R, 2.2) * 0.38); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + G, y); ctx.stroke(); }
        if (dv < R) { ctx.strokeStyle = rgba(Math.pow(1 - dv / R, 2.2) * 0.38); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + G); ctx.stroke(); }
    }
}

function estela(ctx, now, sy) {
    rastro = rastro.filter((p) => now - p.t < 650);
    ctx.lineWidth = 1.25;
    for (let i = 1; i < rastro.length; i++) {
        const a = rastro[i - 1], b = rastro[i], vida = 1 - (now - b.t) / 650;
        ctx.strokeStyle = rgba(vida * vida * 0.55);
        ctx.beginPath(); ctx.moveTo(a.x, a.y - sy); ctx.lineTo(b.x, a.y - sy); ctx.lineTo(b.x, b.y - sy); ctx.stroke();
    }
    ondas = ondas.filter((o) => now - o.t < 1100);
    for (const o of ondas) {
        const fase = (now - o.t) / 1100, radio = (1 - Math.pow(1 - fase, 3)) * 260;
        ctx.strokeStyle = rgba((1 - fase) * 0.45); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(o.x, o.y - sy, radio, 0, 6.2832); ctx.stroke();
    }
}

function cuadro(now) {
    requestAnimationFrame(cuadro);
    const d = window.devicePixelRatio || 1, w = window.innerWidth, h = window.innerHeight;
    if (lienzo.width !== Math.round(w * d) || lienzo.height !== Math.round(h * d)) {
        lienzo.width = Math.round(w * d); lienzo.height = Math.round(h * d);
    }
    const ctx = lienzo.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const zona = heroe();
    if (estado.quieto || !zona) return;
    const r = zona.getBoundingClientRect();
    if (r.bottom <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(r.left, r.top, r.width, r.height); ctx.clip();
    if (raton && dentro(raton.y)) cuadricula(ctx, -(window.scrollX % G), -(window.scrollY % G));
    estela(ctx, now, window.scrollY);
    ctx.restore();
}

window.addEventListener('pointermove', (e) => {
    raton = { x: e.clientX, y: e.clientY };
    if (!heroe() || !dentro(e.clientY)) return;
    const x = Math.round((e.clientX - 0.5) / G) * G + 0.5, y = Math.round((e.clientY + window.scrollY - 0.5) / G) * G + 0.5;
    const ultimo = rastro[rastro.length - 1];
    if (!ultimo || ultimo.x !== x || ultimo.y !== y) { rastro.push({ x, y, t: performance.now() }); if (rastro.length > 40) rastro.shift(); }
}, { passive: true });
document.addEventListener('pointerleave', () => { raton = null; });
window.addEventListener('pointerdown', (e) => {
    if (heroe() && dentro(e.clientY) && !estado.quieto) ondas.push({ x: e.clientX, y: e.clientY + window.scrollY, t: performance.now() });
}, { passive: true });

requestAnimationFrame(cuadro);
