import { $, anunciar, irA } from './dom.js';
import { estado, actualizar, suscribir, toca } from './state.js';

suscribir((s, cambios) => {
    if (!toca(cambios, 'fase')) return;
    $('vista-upload').hidden = s.fase !== 'upload';
    $('vista-loading').hidden = s.fase !== 'loading';
    $('vista-resultados').hidden = s.fase !== 'results';
    $('btn-otra').hidden = s.fase !== 'results';
    if (s.fase === 'results') {
        setTimeout(() => $('titulo-resultados').focus({ preventScroll: true }), 60);
    }
});

$('btn-otra').addEventListener('click', () => {
    actualizar({ fase: 'upload', archivo: null, error: null, falla: null, sel: null, datos: null, modelo: null });
    anunciar('Listo para analizar otra red.');
    irA('analizar');
});

$('btn-inicio').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: estado.quieto ? 'auto' : 'smooth' });
});
