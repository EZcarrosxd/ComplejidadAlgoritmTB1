import { $, crear, plural } from './dom.js';
import { estado, suscribir, toca } from './estado.js';
import { vista, nodoEn, zoomEn } from './camara.js';
import { clicEnNodo } from './acciones.js';

export const puntero = { bajoPuntero: -1 };

const lienzo = $('grafo');
const tip = $('tip');
const ACCION = { general: 'Clic: ver datos', mst: 'Clic: ver datos', flujo: 'Clic: elegir', fallas: 'Clic: simular falla' };

function ubicar(evento) {
    const rectangulo = lienzo.getBoundingClientRect();
    return { x: evento.clientX - rectangulo.left, y: evento.clientY - rectangulo.top };
}

function mostrarTip(i, p) {
    const m = estado.modelo;
    if (i < 0 || !m) { tip.hidden = true; return; }
    tip.replaceChildren(
        crear('div', 'tip-id', m.ids[i]),
        crear('div', '', plural(m.grado[i], 'conexión', 'conexiones')),
        ...(m.esCritico[i] ? [crear('div', 'tip-crit', 'Punto débil')] : []),
        crear('div', 'tip-act', ACCION[estado.modo]),
    );
    const x = Math.min(p.x + 16, lienzo.clientWidth - 170), y = Math.max(p.y - 70, 8);
    tip.style.transform = `translate(${x}px, ${y}px)`;
    tip.hidden = false;
}

export function iniciarInteraccion(dibujar) {
    let arrastre = null;

    function limpiarPuntero() {
        puntero.bajoPuntero = -1;
        mostrarTip(-1);
    }

    suscribir((s, cambios) => {
        if (toca(cambios, 'modelo', 'fase', 'modo')) limpiarPuntero();
    });

    lienzo.addEventListener('pointerdown', (evento) => {
        const punto = ubicar(evento);
        arrastre = { ...punto, desplazamientoX: vista.desplazamientoX, desplazamientoY: vista.desplazamientoY, movido: false };
        lienzo.setPointerCapture(evento.pointerId);
    });

    lienzo.addEventListener('pointermove', (evento) => {
        const punto = ubicar(evento);
        if (arrastre) {
            const dx = punto.x - arrastre.x, dy = punto.y - arrastre.y;
            if (Math.abs(dx) + Math.abs(dy) > 5) arrastre.movido = true;
            if (arrastre.movido) {
                vista.desplazamientoX = arrastre.desplazamientoX + dx;
                vista.desplazamientoY = arrastre.desplazamientoY + dy;
                vista.movida = true;
                lienzo.style.cursor = 'grabbing';
                limpiarPuntero();
                dibujar();
                return;
            }
        }
        const indice = nodoEn(estado.modelo?.pos, punto);
        const cambio = puntero.bajoPuntero !== indice;
        puntero.bajoPuntero = indice;
        lienzo.style.cursor = indice >= 0 ? 'pointer' : 'crosshair';
        mostrarTip(indice, punto);
        if (cambio) dibujar();
    });

    lienzo.addEventListener('pointerup', (evento) => {
        if (arrastre && !arrastre.movido) {
            const indice = nodoEn(estado.modelo?.pos, ubicar(evento));
            if (indice >= 0) clicEnNodo(indice);
        }
        arrastre = null;
        lienzo.style.cursor = 'crosshair';
    });

    lienzo.addEventListener('pointercancel', () => {
        arrastre = null;
        limpiarPuntero();
        lienzo.style.cursor = 'crosshair';
        dibujar();
    });

    lienzo.addEventListener('pointerleave', () => {
        limpiarPuntero();
        dibujar();
    });

    lienzo.addEventListener('wheel', (evento) => {
        evento.preventDefault();
        zoomEn(ubicar(evento), Math.exp(-evento.deltaY * 0.0015));
        limpiarPuntero();
        dibujar();
    }, { passive: false });
}
