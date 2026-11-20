import { vista } from './camara.js';
import {
    dibujarFondo, dibujarLineas, dibujarNodos, dibujarEtiquetas, dibujarAnillos, dibujarHalosCriticos, dibujarRombos,
} from './dibujo-grafo.js';
import {
    dibujarMst, dibujarMstReciente, dibujarFlujo, dibujarParticulas,
    dibujarExtremos, dibujarLineasFalla, dibujarOndas, dibujarNodoCaido, dibujarCapaAristas, dibujarCapaNodos,
} from './capas-grafo.js';

function claveVista(c, densidad) {
    return [c.w, c.h, densidad, vista.escala, vista.desplazamientoX, vista.desplazamientoY, c.modo, c.entrada,
        c.falla ? c.falla.id : ''].join('|');
}

function claveNodos(c, densidad) {
    const { falla, t } = c;
    const fallaEnCurso = falla && t - falla.inicio <= falla.duracion;
    return [claveVista(c, densidad), c.sel, c.bajoPuntero, falla ? falla.inicio : '', fallaEnCurso ? t : ''].join('|');
}

function dibujarFondoFijo(c) {
    dibujarFondo(c);
    c.ctx.globalAlpha = 0.25 + 0.75 * c.entrada;
    dibujarLineas(c);
    if (c.modo === 'flujo') dibujarFlujo(c);
    if (c.falla) dibujarLineasFalla(c);
    c.ctx.globalAlpha = 1;
}

function dibujarNodosFijos(c) {
    c.ctx.clearRect(0, 0, c.w, c.h);
    c.ctx.globalAlpha = 0.25 + 0.75 * c.entrada;
    dibujarNodos(c);
    if (c.falla) dibujarNodoCaido(c);
    c.ctx.globalAlpha = 1;
    dibujarEtiquetas(c);
    dibujarAnillos(c);
    if (c.modo === 'flujo') dibujarExtremos(c);
}

function crearCapa(dibujarCapa, calcularClave) {
    const lienzo = document.createElement('canvas');
    return { lienzo, ctx: lienzo.getContext('2d'), clave: '', modelo: null, dibujarCapa, calcularClave };
}

export function crearMotor(lienzo) {
    const ctx = lienzo.getContext('2d');
    const capas = [crearCapa(dibujarFondoFijo, claveVista), crearCapa(dibujarNodosFijos, claveNodos)];
    let densidad = 1;

    function redimensionar(w, h, escala) {
        densidad = escala;
        const anchoReal = Math.round(w * escala), altoReal = Math.round(h * escala);
        for (const destino of [lienzo, ...capas.map((capa) => capa.lienzo)]) {
            if (destino.width !== anchoReal) destino.width = anchoReal;
            if (destino.height !== altoReal) destino.height = altoReal;
        }
        capas.forEach((capa) => { capa.clave = ''; });
    }

    function pintarCapa(capa, escena) {
        const clave = capa.calcularClave(escena, densidad);
        if (clave !== capa.clave || escena.m !== capa.modelo) {
            capa.ctx.setTransform(densidad, 0, 0, densidad, 0, 0);
            capa.dibujarCapa({ ...escena, ctx: capa.ctx });
            capa.clave = clave;
            capa.modelo = escena.m;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(capa.lienzo, 0, 0);
        ctx.setTransform(densidad, 0, 0, densidad, 0, 0);
    }

    function dibujar(entrada) {
        const escena = entrada.capa ? { ...entrada, modo: 'capa', falla: null } : entrada;
        const c = { ...escena, ctx };
        pintarCapa(capas[0], escena);
        if (c.capa) dibujarCapaAristas(c);
        if (c.modo === 'mst') {
            ctx.globalAlpha = 0.25 + 0.75 * c.entrada;
            dibujarMst(c);
            dibujarMstReciente(c);
            ctx.globalAlpha = 1;
        }
        if (c.modo === 'flujo') dibujarParticulas(c);
        pintarCapa(capas[1], escena);
        if (c.capa) dibujarCapaNodos(c);
        if (c.falla) dibujarOndas(c);
        dibujarHalosCriticos(c);
        dibujarRombos(c);
    }

    return { redimensionar, dibujar };
}
