import { $ } from './dom.js';
import { estado, suscribir, toca } from './state.js';
import { vista, ajustar, zoomEn } from './camera.js';
import { avanzar, asentar } from './layout.js';
import { COLOR, dibujarFondo, dibujarLineas, dibujarNodos, dibujarEtiquetas, dibujarAnillos } from './graph-draw.js';
import { dibujarMst, dibujarFlujo, dibujarExtremos, dibujarLineasFalla, dibujarNodoCaido } from './graph-overlays.js';
import { dibujarParticulas, limpiarParticulas } from './particles.js';
import { puntero } from './graph-input.js';

const lienzo = $('grafo');
let mstInicio = performance.now();
let ultimo = 0;

const ancho = () => lienzo.clientWidth;
const alto = () => lienzo.clientHeight;

function redimensionar() {
    const d = window.devicePixelRatio || 1;
    const w = Math.round(ancho() * d), h = Math.round(alto() * d);
    if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
    if (!vista.movida && estado.modelo) ajustar(estado.modelo.pos, ancho(), alto());
}

function dibujar(now, dt) {
    const m = estado.modelo, w = ancho(), h = alto();
    if (!m || estado.fase !== 'results' || !w || !h) return;
    if (avanzar(m.pos, m.aristas) && !vista.movida) ajustar(m.pos, w, h);

    const d = window.devicePixelRatio || 1;
    const ctx = lienzo.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const modo = estado.modo;
    const c = {
        ctx, m, pos: m.pos, w, h, modo, now, mstInicio,
        quieto: estado.quieto,
        falla: modo === 'fallas' ? estado.falla : null,
        sel: estado.sel ? (m.idx.get(estado.sel) ?? -1) : -1,
        hover: puntero.hover,
    };

    dibujarFondo(c);
    dibujarLineas(c);
    let pool = null, color = COLOR.amber;
    if (modo === 'general') pool = m.aristas;
    if (modo === 'mst') { pool = dibujarMst(c); color = COLOR.lime; }
    if (modo === 'flow') dibujarFlujo(c);
    if (c.falla) dibujarLineasFalla(c);
    dibujarParticulas(c, pool, color, dt);
    dibujarNodos(c);
    if (c.falla) dibujarNodoCaido(c);
    dibujarEtiquetas(c);
    dibujarAnillos(c);
    if (modo === 'flow') dibujarExtremos(c);
}

function cuadro(now) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(50, now - (ultimo || now));
    ultimo = now;
    dibujar(now, dt);
}

export function reiniciarMst() {
    mstInicio = performance.now();
    limpiarParticulas();
}

export function centrar() {
    vista.movida = false;
    if (estado.modelo) ajustar(estado.modelo.pos, ancho(), alto());
}

export const acercar = () => zoomEn({ x: ancho() / 2, y: alto() / 2 }, 1.3);
export const alejar = () => zoomEn({ x: ancho() / 2, y: alto() / 2 }, 1 / 1.3);

suscribir((s, cambios) => {
    if (toca(cambios, 'fase') && s.fase === 'results') {
        vista.movida = false;
        requestAnimationFrame(redimensionar);
    }
    if (toca(cambios, 'modo')) {
        limpiarParticulas();
        if (s.modo === 'mst') reiniciarMst();
    }
    if (toca(cambios, 'quieto') && s.quieto && s.modelo) {
        asentar(s.modelo.pos, s.modelo.aristas);
        if (!vista.movida) centrar();
    }
});

new ResizeObserver(() => requestAnimationFrame(redimensionar)).observe(lienzo);
$('btn-acercar').addEventListener('click', acercar);
$('btn-alejar').addEventListener('click', alejar);
$('btn-ajustar').addEventListener('click', centrar);
requestAnimationFrame(cuadro);
