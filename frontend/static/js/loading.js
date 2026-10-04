import { $, crear } from './dom.js';
import { suscribir, toca } from './state.js';
import { cancelar } from './analysis.js';

function crearPaso(paso, i) {
    const marca = crear('span', 'step-mark', paso.estado === 'done' ? '✓' : String(i + 1));
    marca.setAttribute('aria-hidden', 'true');
    const texto = crear('div');
    texto.append(crear('p', 'step-label', paso.label));
    if (paso.detalle) texto.append(crear('p', 'step-detail', paso.detalle));
    const item = crear('li', `step step--${paso.estado}`);
    item.append(marca, texto, crear('span', 'step-status', paso.status));
    return item;
}

suscribir((s, cambios) => {
    if (!toca(cambios, 'pasos')) return;
    const hechos = s.pasos.filter((paso) => paso.estado === 'done').length;
    const pct = s.pasos.length ? Math.round(hechos / s.pasos.length * 100) : 0;
    $('pct').textContent = `${pct}%`;
    $('progreso').setAttribute('aria-valuenow', String(pct));
    $('progreso-barra').style.width = `${pct}%`;
    $('pasos').replaceChildren(...s.pasos.map(crearPaso));
});

$('btn-cancelar').addEventListener('click', cancelar);
