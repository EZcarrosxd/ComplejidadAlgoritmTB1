import { $, crear } from './dom.js';
import { suscribir, toca } from './estado.js';
import { cancelar } from './analisis.js';

function crearPaso(paso) {
    const texto = crear('div');
    texto.append(crear('p', 'paso-titulo', paso.titulo));
    if (paso.detalle) texto.append(crear('p', 'paso-detalle', paso.detalle));
    const elemento = crear('li', `paso paso--${paso.estado}`);
    elemento.append(texto, crear('span', 'paso-estado', paso.mensaje));
    return elemento;
}

suscribir((estado, cambios) => {
    if (!toca(cambios, 'pasos')) return;
    const total = estado.pasos.length;
    const completados = estado.pasos.filter((paso) => paso.estado === 'listo').length;
    const porcentaje = total ? Math.round(completados / total * 100) : 0;
    $('porcentaje').textContent = `${porcentaje}%`;
    $('progreso').setAttribute('aria-valuenow', String(porcentaje));
    $('progreso-barra').style.width = `${porcentaje}%`;
    $('pasos').replaceChildren(...estado.pasos.map(crearPaso));
});

$('btn-cancelar').addEventListener('click', cancelar);
