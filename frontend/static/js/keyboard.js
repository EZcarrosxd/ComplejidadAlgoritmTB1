import { estado } from './state.js';
import { cambiarModo, restaurar } from './actions.js';
import { abrirAyuda, cerrarAyuda } from './help.js';
import { acercar, alejar, centrar } from './graph.js';

const MODOS = { 1: 'general', 2: 'mst', 3: 'flow', 4: 'fallas' };

window.addEventListener('keydown', (e) => {
    const etiqueta = (e.target && e.target.tagName) || '';

    if (e.key === 'Escape') {
        if (estado.ayuda) { cerrarAyuda(); return; }
        if (estado.falla) { restaurar(); return; }
    }
    if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '?') { abrirAyuda(); return; }
    if (estado.fase !== 'results' || estado.ayuda) return;

    if (MODOS[e.key]) cambiarModo(MODOS[e.key]);
    else if (e.key === 'f' || e.key === 'F') centrar();
    else if (e.key === '+' || e.key === '=') acercar();
    else if (e.key === '-') alejar();
});
