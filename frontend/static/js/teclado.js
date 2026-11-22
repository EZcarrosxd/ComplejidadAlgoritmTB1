import { estado } from './estado.js';
import { abrirAyuda, cerrarAyuda } from './ayuda.js';
import { acercarGeografica, alejarGeografica, ajustarGeografica } from './vista-geografica.js';

window.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && estado.ayuda) cerrarAyuda();
    if (evento.target.matches('input, textarea') || evento.metaKey || evento.ctrlKey || evento.altKey) return;
    if (evento.key === '?') abrirAyuda();
    if (estado.ayuda || estado.fase !== 'geografica') return;
    if (evento.key.toLowerCase() === 'f') ajustarGeografica();
    else if (evento.key === '+' || evento.key === '=') acercarGeografica();
    else if (evento.key === '-') alejarGeografica();
});
