import { $ } from './dom.js';

export function showView(name) {
    const enResultados = name === 'results';
    $('upload-view').hidden = enResultados;
    $('results-view').hidden = !enResultados;
    window.scrollTo(0, 0);
    if (enResultados) $('results-title').focus({ preventScroll: true });
}

export function setStatus(text) { $('status').textContent = text; }


export function showError(message) {
    $('upload-error-text').textContent = message;
    $('upload-error').hidden = false;
}
export function hideError() { $('upload-error').hidden = true; }
