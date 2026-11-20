import { $ } from './dom.js';
import { estado, suscribir, toca } from './estado.js';
import { vista, ajustar, zoomEn } from './camara.js';
import { dibujarFondo, dibujarLineas, dibujarNodos, dibujarEtiquetas, dibujarAnillos } from './dibujo-grafo.js';
import { dibujarMst, dibujarFlujo, dibujarExtremos, dibujarLineasFalla, dibujarNodoCaido } from './capas-grafo.js';
import { iniciarInteraccion, puntero } from './interaccion-grafo.js';

const lienzo = $('grafo');
const ctx = lienzo.getContext('2d');
const ancho = () => lienzo.clientWidth;
const alto = () => lienzo.clientHeight;

function redimensionar() {
    if (estado.fase !== 'resultados') return;
    const escala = window.devicePixelRatio || 1;
    const w = Math.round(ancho() * escala), h = Math.round(alto() * escala);
    if (lienzo.width !== w) lienzo.width = w;
    if (lienzo.height !== h) lienzo.height = h;
    if (!vista.movida && estado.modelo) ajustar(estado.modelo.pos, ancho(), alto());
    dibujar();
}

function dibujar() {
    const m = estado.modelo, w = ancho(), h = alto();
    if (!m || estado.fase !== 'resultados' || !w || !h) return;
    const escala = window.devicePixelRatio || 1;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    const modo = estado.modo;
    const escena = {
        ctx, m, pos: m.pos, w, h, modo,
        falla: modo === 'fallas' ? estado.falla : null,
        sel: m.indices.get(estado.sel) ?? -1,
        bajoPuntero: puntero.bajoPuntero,
    };

    dibujarFondo(escena);
    dibujarLineas(escena);
    if (modo === 'mst') dibujarMst(escena);
    if (modo === 'flujo') dibujarFlujo(escena);
    if (escena.falla) dibujarLineasFalla(escena);
    dibujarNodos(escena);
    if (escena.falla) dibujarNodoCaido(escena);
    dibujarEtiquetas(escena);
    dibujarAnillos(escena);
    if (modo === 'flujo') dibujarExtremos(escena);
}

export function centrar() {
    vista.movida = false;
    redimensionar();
}

function ampliar(factor) {
    zoomEn({ x: ancho() / 2, y: alto() / 2 }, factor);
    dibujar();
}

export const acercar = () => ampliar(1.3);
export const alejar = () => ampliar(1 / 1.3);

iniciarInteraccion(dibujar);

suscribir((s, cambios) => {
    if (toca(cambios, 'fase') && s.fase === 'resultados') vista.movida = false;
    if (toca(cambios, 'fase', 'modelo')) redimensionar();
    else if (toca(cambios, 'modo', 'sel', 'falla')) dibujar();
});

new ResizeObserver(redimensionar).observe(lienzo);
$('btn-acercar').addEventListener('click', acercar);
$('btn-alejar').addEventListener('click', alejar);
$('btn-ajustar').addEventListener('click', centrar);
