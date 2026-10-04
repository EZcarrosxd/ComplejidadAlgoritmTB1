import { $, form, fileInput, btnSubmit } from './dom.js';
import { showView, setStatus, showError, hideError } from './views.js';
import { analizarRed, MENSAJE_SIN_CONEXION } from './api.js';
import { poblarDashboard } from './dashboard.js';
import { dibujarGrafo } from './graph.js';

function setLoading(loading) {
    btnSubmit.classList.toggle('is-loading', loading);
    btnSubmit.setAttribute('aria-busy', String(loading));
    $('btn-label').textContent = loading ? 'Analizando red…' : 'Analizar red';
    btnSubmit.disabled = loading || !fileInput.files[0];
    fileInput.disabled = loading;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) return;

    setLoading(true);
    hideError();
    setStatus('Analizando la red. Esto puede tardar unos segundos.');

    try {
        const datos = await analizarRed(file);

        poblarDashboard(datos, file.name);
        showView('results');
        requestAnimationFrame(() => dibujarGrafo(datos));
        setStatus('Análisis completo.');
    } catch (error) {
        showError(error instanceof TypeError ? MENSAJE_SIN_CONEXION : error.message);
        setStatus('El análisis falló.');
    } finally {
        setLoading(false);
    }
});
