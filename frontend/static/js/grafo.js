import { $, formatoMoneda } from './dom.js';
import { estado, suscribir, toca } from './estado.js';
import { vista, ajustar, zoomEn } from './camara.js';
import { iniciarInteraccion, puntero } from './interaccion-grafo.js';
import { crearCapa } from './algoritmos.js';

export const MOTOR = new URLSearchParams(location.search).get('motor') === 'canvas' ? 'canvas' : 'three';
const { crearMotor } = MOTOR === 'three' ? await import('./motor-three.js') : await import('./motor-canvas.js');

const DURACION_ENTRADA = 1.4;
const DURACION_KRUSKAL = 5;

const lienzo = $('grafo');
const motor = crearMotor(lienzo);
const animacion = { entrada: -Infinity, kruskal: -Infinity, objetivo: null, cuadro: 0, costoParcial: false };
const memoria = { clave: [], capa: null };
const ancho = () => lienzo.clientWidth;
const alto = () => lienzo.clientHeight;
const ahora = () => performance.now() / 1000;

function encuadrar() {
    ajustar(estado.modelo.pos, ancho(), alto());
    animacion.objetivo = { escala: vista.escala, desplazamientoX: vista.desplazamientoX, desplazamientoY: vista.desplazamientoY };
}

function aplicarEntrada(t) {
    const progreso = Math.min(1, Math.max(0, (t - animacion.entrada) / DURACION_ENTRADA));
    if (vista.movida || !animacion.objetivo || progreso >= 1) return 1;
    const suave = 1 - (1 - progreso) ** 3;
    const factor = 0.08 + 0.92 * suave;
    const objetivo = animacion.objetivo;
    const centroX = ancho() / 2, centroY = alto() / 2;
    vista.escala = objetivo.escala * factor;
    vista.desplazamientoX = centroX - (centroX - objetivo.desplazamientoX) * factor;
    vista.desplazamientoY = centroY - (centroY - objetivo.desplazamientoY) * factor;
    return suave;
}

function mostrarCostoParcial(m, kruskal) {
    const total = estado.datos.costo_minimo_instalacion;
    const parcial = estado.modo === 'mst' && estado.paso === null && kruskal < 1;
    if (parcial) {
        const cantidad = Math.floor(m.mst.length * kruskal);
        const fraccion = cantidad > 0 ? m.fraccionCosto[cantidad - 1] : 0;
        $('valor-mst').textContent = `S/ ${formatoMoneda.format(total * fraccion)}`;
        animacion.costoParcial = true;
    } else if (animacion.costoParcial) {
        $('valor-mst').textContent = `S/ ${formatoMoneda.format(total)}`;
        animacion.costoParcial = false;
    }
}

function capaActual(m) {
    const clave = [estado.datos, m, estado.modo, estado.paso];
    if (clave.some((valor, i) => valor !== memoria.clave[i])) {
        memoria.clave = clave;
        memoria.capa = crearCapa(estado.datos, m, estado.modo, estado.paso);
    }
    return memoria.capa;
}

function dibujar() {
    const m = estado.modelo, w = ancho(), h = alto();
    if (!m || estado.fase !== 'resultados' || !w || !h) return;
    const t = ahora();
    const entrada = aplicarEntrada(t);
    const kruskal = Math.min(1, Math.max(0, (t - animacion.kruskal) / DURACION_KRUSKAL));
    mostrarCostoParcial(m, kruskal);
    motor.dibujar({
        m, pos: m.pos, w, h, t, entrada, kruskal,
        capa: capaActual(m),
        modo: estado.modo,
        falla: estado.modo === 'fallas' ? estado.falla : null,
        sel: m.indices.get(estado.sel) ?? -1,
        bajoPuntero: puntero.bajoPuntero,
    });
}

function cuadro() {
    animacion.cuadro = 0;
    if (estado.fase !== 'resultados' || !estado.modelo || document.hidden) return;
    dibujar();
    animacion.cuadro = requestAnimationFrame(cuadro);
}

function arrancar() {
    if (!animacion.cuadro) animacion.cuadro = requestAnimationFrame(cuadro);
}

function redimensionar() {
    if (estado.fase !== 'resultados' || !estado.modelo) return;
    motor.redimensionar(ancho(), alto(), window.devicePixelRatio || 1);
    if (!vista.movida) encuadrar();
    arrancar();
}

export function centrar() {
    vista.movida = false;
    animacion.entrada = -Infinity;
    redimensionar();
}

function ampliar(factor) {
    zoomEn({ x: ancho() / 2, y: alto() / 2 }, factor);
}

export const acercar = () => ampliar(1.3);
export const alejar = () => ampliar(1 / 1.3);

iniciarInteraccion(arrancar);

suscribir((s, cambios) => {
    if (toca(cambios, 'fase') && s.fase === 'resultados') {
        vista.movida = false;
        animacion.entrada = ahora();
    }
    if (toca(cambios, 'modo') && s.modo === 'mst') animacion.kruskal = ahora();
    if (toca(cambios, 'fase', 'modelo')) redimensionar();
    else if (toca(cambios, 'modo', 'sel', 'falla', 'paso')) arrancar();
});

new ResizeObserver(redimensionar).observe(lienzo);
document.addEventListener('visibilitychange', arrancar);
$('btn-acercar').addEventListener('click', acercar);
$('btn-alejar').addEventListener('click', alejar);
$('btn-ajustar').addEventListener('click', centrar);
