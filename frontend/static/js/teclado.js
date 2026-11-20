import { estado } from './estado.js';
import { cambiarModo, restaurar } from './acciones.js';
import { abrirAyuda, cerrarAyuda } from './ayuda.js';
import { acercar, alejar, centrar } from './grafo.js';
import { CATALOGO } from './algoritmos.js';
import { alternarReproduccion, avanzarPaso, cerrarPasos } from './reproductor.js';

window.addEventListener('keydown', (e) => {
    const etiqueta = (e.target && e.target.tagName) || '';

    if (e.key === 'Escape') {
        if (estado.ayuda) { cerrarAyuda(); return; }
        if (estado.falla) { restaurar(); return; }
        if (estado.paso !== null) { cerrarPasos(); return; }
    }
    if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '?') { abrirAyuda(); return; }
    if (estado.fase !== 'resultados' || estado.ayuda) return;

    const numero = Number(e.key);
    if (Number.isInteger(numero) && numero >= 1 && numero <= 9) cambiarModo(CATALOGO[numero - 1].id);
    else if (e.key === 'ArrowRight' && estado.paso !== null) { e.preventDefault(); avanzarPaso(1); }
    else if (e.key === 'ArrowLeft' && estado.paso !== null) { e.preventDefault(); avanzarPaso(-1); }
    else if (e.key === ' ' && estado.paso !== null && etiqueta !== 'BUTTON') { e.preventDefault(); alternarReproduccion(); }
    else if (e.key === 'f' || e.key === 'F') centrar();
    else if (e.key === '+' || e.key === '=') acercar();
    else if (e.key === '-') alejar();
});
