import { cargarFragmentos } from './fragmentos.js';

try {
    await cargarFragmentos(document);
    await import('./main.js');
    document.querySelector('.page').inert = false;
    document.getElementById('page-loading').remove();
} catch (error) {
    const aviso = document.getElementById('page-loading');
    aviso.setAttribute('role', 'alert');
    aviso.textContent = 'Recarga la página para intentar iniciarla de nuevo';
    console.error(error);
}
