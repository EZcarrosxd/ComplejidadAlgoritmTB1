import { $, plural } from './dom.js';
import { estado, actualizar, suscribir, toca } from './state.js';
import { cambiarModo, simularFalla } from './actions.js';

suscribir((s, cambios) => {
    if (!toca(cambios, 'sel', 'modelo')) return;
    const m = s.modelo;
    const i = m && s.sel ? m.idx.get(s.sel) : undefined;
    const haySeleccion = i !== undefined;
    $('seleccion').hidden = !haySeleccion;
    $('nota-general').hidden = haySeleccion;
    if (!haySeleccion) return;
    $('sel-id').textContent = s.sel;
    $('sel-tipo').textContent = m.esCritico[i] ? 'Punto débil' : '';
    $('sel-grado').textContent = plural(m.grado[i], 'conexión', 'conexiones');
});

$('sel-origen').addEventListener('click', () => {
    const id = estado.sel;
    cambiarModo('flow');
    actualizar({ origen: id, siguiente: 'destino' });
});

$('sel-destino').addEventListener('click', () => {
    const id = estado.sel;
    cambiarModo('flow');
    actualizar({ destino: id, siguiente: 'origen' });
});

$('sel-falla').addEventListener('click', () => {
    const id = estado.sel;
    cambiarModo('fallas');
    simularFalla(id);
});
