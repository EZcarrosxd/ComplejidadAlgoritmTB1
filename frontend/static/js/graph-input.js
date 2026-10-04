import { $, crear, plural } from './dom.js';
import { estado } from './state.js';
import { vista, nodoEn, zoomEn } from './camera.js';
import { clicEnNodo } from './actions.js';

export const puntero = { hover: -1 };

const lienzo = $('grafo');
const tip = $('tip');
const ACCION = { general: 'Clic: ver datos', mst: 'Clic: ver datos', flow: 'Clic: elegir', fallas: 'Clic: simular falla' };
let arrastre = null;

const pos = () => (estado.modelo ? estado.modelo.pos : null);

function ubicar(evento) {
    const r = lienzo.getBoundingClientRect();
    return { x: evento.clientX - r.left, y: evento.clientY - r.top };
}

function mostrarTip(i, p) {
    const m = estado.modelo;
    if (i < 0 || !p || !m) { tip.style.opacity = '0'; return; }
    tip.replaceChildren(
        crear('div', 'tip-id', m.ids[i]),
        crear('div', '', plural(m.grado[i], 'conexión', 'conexiones')),
        ...(m.esCritico[i] ? [crear('div', 'tip-crit', 'Punto débil')] : []),
        crear('div', 'tip-act', ACCION[estado.modo]),
    );
    const x = Math.min(p.x + 16, lienzo.clientWidth - 170), y = Math.max(p.y - 70, 8);
    tip.style.transform = `translate(${x}px, ${y}px)`;
    tip.style.opacity = '1';
}

lienzo.addEventListener('pointerdown', (e) => {
    const p = ubicar(e);
    arrastre = { ...p, tx: vista.tx, ty: vista.ty, movido: false };
    lienzo.setPointerCapture(e.pointerId);
});

lienzo.addEventListener('pointermove', (e) => {
    const p = ubicar(e);
    if (arrastre) {
        const dx = p.x - arrastre.x, dy = p.y - arrastre.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) arrastre.movido = true;
        if (arrastre.movido) {
            vista.tx = arrastre.tx + dx;
            vista.ty = arrastre.ty + dy;
            vista.movida = true;
            lienzo.style.cursor = 'grabbing';
            mostrarTip(-1);
            return;
        }
    }
    const i = nodoEn(pos(), p);
    puntero.hover = i;
    lienzo.style.cursor = i >= 0 ? 'pointer' : 'crosshair';
    mostrarTip(i, p);
});

lienzo.addEventListener('pointerup', (e) => {
    if (arrastre && !arrastre.movido) {
        const i = nodoEn(pos(), ubicar(e));
        if (i >= 0) clicEnNodo(i);
    }
    arrastre = null;
    lienzo.style.cursor = 'crosshair';
});

lienzo.addEventListener('pointerleave', () => {
    puntero.hover = -1;
    mostrarTip(-1);
});

lienzo.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomEn(ubicar(e), Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
