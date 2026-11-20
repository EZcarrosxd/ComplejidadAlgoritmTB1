import { pantallaX, pantallaY, vista } from './camara.js';

export const COLOR = {
    well: '#FAF8F5', ink: '#1F1E1B', dim: '#B9B2A6',
    lime: '#3E7B3A', amber: '#A5620E', red: '#C23B2C',
};

const PUNTO_FONDO = '#E4DED4';
const LINEA = 'rgba(120, 112, 100, .4)';
const LINEA_TENUE = 'rgba(120, 112, 100, .18)';
const ANILLO_TENUE = '#B9B2A6';
const SOMBRA = 'rgba(31, 30, 27, .12)';
const ROJO_SUAVE = '#FBEDEA';
const SEPARACION_FONDO = 24;
const VUELTA = Math.PI * 2;
const MARGEN = 20;

let patronFondo = null;

export function trazar(c, [u, v]) {
    c.ctx.moveTo(pantallaX(c.pos, u), pantallaY(c.pos, u));
    c.ctx.lineTo(pantallaX(c.pos, v), pantallaY(c.pos, v));
}

export function radioNodo(m, i) {
    const base = Math.min(6.5, 1.6 + Math.sqrt(m.grado[i] ?? 1) * 1.1);
    return base * Math.min(1.5, Math.max(0.6, vista.escala * 0.9));
}

export function estaVisible(c, x, y) {
    return x > -MARGEN && x < c.w + MARGEN && y > -MARGEN && y < c.h + MARGEN;
}

function crearPatron(ctx) {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = SEPARACION_FONDO;
    const pincel = lienzo.getContext('2d');
    pincel.fillStyle = PUNTO_FONDO;
    pincel.fillRect(0, 0, 2, 2);
    return ctx.createPattern(lienzo, 'repeat');
}

export function dibujarFondo({ ctx, w, h }) {
    ctx.fillStyle = COLOR.well;
    ctx.fillRect(0, 0, w, h);
    patronFondo ??= crearPatron(ctx);
    const ox = ((vista.desplazamientoX % SEPARACION_FONDO) + SEPARACION_FONDO) % SEPARACION_FONDO;
    const oy = ((vista.desplazamientoY % SEPARACION_FONDO) + SEPARACION_FONDO) % SEPARACION_FONDO;
    ctx.save();
    ctx.translate(ox - 1, oy - 1);
    ctx.fillStyle = patronFondo;
    ctx.fillRect(-ox, -oy, w + SEPARACION_FONDO, h + SEPARACION_FONDO);
    ctx.restore();
}

export function dibujarLineas(c) {
    const { ctx, m, modo, falla } = c;
    ctx.lineWidth = modo === 'general' ? 1.1 : 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = modo === 'general' ? LINEA : LINEA_TENUE;
    ctx.beginPath();
    for (const e of m.aristas) {
        if (falla && (e[0] === falla.indice || e[1] === falla.indice)) continue;
        trazar(c, e);
    }
    ctx.stroke();
}

function circulo(ctx, x, y, r) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, VUELTA);
}

function rombo(ctx, x, y, r) {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath();
}

export function estaApagado(c, i) {
    const { falla, t } = c;
    if (!falla || !falla.aislados.has(i)) return false;
    return t - falla.inicio >= (falla.retraso.get(i) ?? 0);
}

function rellenarGrupo(ctx, color, puntos) {
    if (!puntos.length) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [x, y, r] of puntos) circulo(ctx, x, y, r);
    ctx.fill();
}

export function dibujarNodos(c) {
    const { ctx, m, pos, modo, falla } = c;
    const sombras = [], aros = new Map(), rellenos = new Map(), centros = new Map(), halos = [];
    const agregar = (mapa, color, punto) => {
        if (!mapa.has(color)) mapa.set(color, []);
        mapa.get(color).push(punto);
    };

    for (let i = 0; i < pos.cantidad; i++) {
        if (m.esCritico[i] || (falla && i === falla.indice)) continue;
        const x = pantallaX(pos, i), y = pantallaY(pos, i);
        if (!estaVisible(c, x, y)) continue;
        const r = radioNodo(m, i);
        let aro = modo === 'general' ? COLOR.ink : ANILLO_TENUE;
        let relleno = '#FFFFFF';
        if (falla) {
            const apagado = estaApagado(c, i);
            aro = apagado ? COLOR.red : ANILLO_TENUE;
            relleno = apagado ? ROJO_SUAVE : '#FFFFFF';
            if (apagado) halos.push([x, y, r * 2.4]);
        }
        sombras.push([x, y + 1.2, r + 0.8]);
        agregar(aros, aro, [x, y, r]);
        agregar(rellenos, relleno, [x, y, Math.max(r - 1.6, 0.8)]);
        if (m.grado[i] >= 4 && r > 2.6) agregar(centros, aro, [x, y, r * 0.38]);
    }

    rellenarGrupo(ctx, 'rgba(194, 59, 44, .14)', halos);
    rellenarGrupo(ctx, SOMBRA, sombras);
    aros.forEach((puntos, color) => rellenarGrupo(ctx, color, puntos));
    rellenos.forEach((puntos, color) => rellenarGrupo(ctx, color, puntos));
    centros.forEach((puntos, color) => rellenarGrupo(ctx, color, puntos));
}

function recorrerCriticos(c, accion) {
    const { m, pos, falla } = c;
    let k = 0;
    for (let i = 0; i < pos.cantidad; i++) {
        if (!m.esCritico[i]) continue;
        k++;
        if (falla && i === falla.indice) continue;
        const x = pantallaX(pos, i), y = pantallaY(pos, i);
        if (estaVisible(c, x, y)) accion(i, k, x, y, radioNodo(m, i) + 2);
    }
}

const destacaCriticos = (modo) => modo === 'general' || modo === 'fallas';

export function dibujarHalosCriticos(c) {
    const { ctx, falla, t, modo } = c;
    if (!destacaCriticos(modo)) return;
    recorrerCriticos(c, (i, k, x, y, r) => {
        const pulso = 1 + Math.sin(t * 3 + k) * 0.18;
        ctx.fillStyle = falla && !estaApagado(c, i) ? 'rgba(194, 59, 44, .06)' : 'rgba(194, 59, 44, .16)';
        ctx.beginPath(); circulo(ctx, x, y, r * 2.1 * pulso); ctx.fill();
    });
}

export function dibujarRombos(c) {
    const { ctx, falla, modo } = c;
    recorrerCriticos(c, (i, k, x, y, r) => {
        const apagado = falla && !estaApagado(c, i);
        ctx.fillStyle = SOMBRA;
        ctx.beginPath(); rombo(ctx, x, y + 1.2, r + 0.8); ctx.fill();
        ctx.fillStyle = apagado || !destacaCriticos(modo) ? '#E3A097' : COLOR.red;
        ctx.beginPath(); rombo(ctx, x, y, r); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    });
}

export function dibujarEtiquetas(c) {
    const { ctx, m, pos } = c;
    if (vista.escala <= 2.4) return;
    ctx.font = '500 11px Inter, sans-serif';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLOR.well;
    ctx.fillStyle = '#4A4740';
    for (let i = 0; i < pos.cantidad; i++) {
        const x = pantallaX(pos, i), y = pantallaY(pos, i);
        if (!estaVisible(c, x, y)) continue;
        const r = radioNodo(m, i);
        ctx.strokeText(m.ids[i], x + r + 4, y - r - 2);
        ctx.fillText(m.ids[i], x + r + 4, y - r - 2);
    }
}

export function dibujarAnillos({ ctx, m, pos, bajoPuntero, sel, modo }) {
    if (bajoPuntero >= 0) {
        ctx.strokeStyle = COLOR.amber; ctx.lineWidth = 2;
        ctx.beginPath(); circulo(ctx, pantallaX(pos, bajoPuntero), pantallaY(pos, bajoPuntero), radioNodo(m, bajoPuntero) + 5); ctx.stroke();
    }
    if (sel >= 0 && (modo === 'general' || modo === 'mst')) {
        const x = pantallaX(pos, sel), y = pantallaY(pos, sel), r = radioNodo(m, sel) + 6;
        ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2.5;
        ctx.beginPath(); circulo(ctx, x, y, r); ctx.stroke();
    }
}
