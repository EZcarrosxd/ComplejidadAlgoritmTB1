import { cargarFragmentos } from './fragments.js';

try {
    await cargarFragmentos(document);
    await import('./main.js');
    document.getElementById('page-loading').remove();
} catch (error) {
    const aviso = document.getElementById('page-loading');
    aviso.setAttribute('role', 'alert');
    aviso.textContent = 'No se pudo iniciar la página. Recarga e inténtalo nuevamente.';
    console.error(error);
}
