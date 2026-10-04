import { $, fileInput } from './dom.js';
import { setStatus } from './views.js';
import { analizarRed, MENSAJE_SIN_CONEXION } from './api.js';
import { poblarDashboard } from './dashboard.js';

$('flow-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const origen = $('flow-origen').value.trim();
    const destino = $('flow-destino').value.trim();
    const errorFlujo = $('flow-error');
    const boton = $('btn-flow');

    if (!file) return;
    if (!origen || !destino) {
        errorFlujo.textContent = 'Indica el origen y el destino.';
        errorFlujo.hidden = false;
        return;
    }

    errorFlujo.hidden = true;
    boton.disabled = true;
    $('btn-reset').disabled = true;
    boton.textContent = 'Calculando…';
    setStatus('Recalculando el flujo máximo.');

    try {
        const datos = await analizarRed(file, origen, destino);
        poblarDashboard(datos, file.name);
        setStatus(`Flujo recalculado entre ${origen} y ${destino}.`);
    } catch (error) {
        errorFlujo.textContent = error instanceof TypeError ? MENSAJE_SIN_CONEXION : error.message;
        errorFlujo.hidden = false;
        setStatus('No se pudo recalcular el flujo.');
    } finally {
        boton.disabled = false;
        $('btn-reset').disabled = false;
        boton.textContent = 'Recalcular flujo';
    }
});
