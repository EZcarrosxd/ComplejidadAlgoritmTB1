import { $, anunciar, irA } from './dom.js';
import { actualizar, suscribir, toca } from './estado.js';

suscribir((s, cambios) => {
    if (!toca(cambios, 'fase')) return;
    const subiendo = s.fase === 'subida';
    $('inicio').hidden = !subiendo;
    $('espacio-trabajo').hidden = subiendo;
    $('vista-loading').hidden = s.fase !== 'progreso';
    $('vista-resultados').hidden = s.fase !== 'resultados';
    $('btn-otra').hidden = s.fase !== 'resultados';    if (subiendo) {
        $('archivo').focus({ preventScroll: true });
    } else {
        const titulo = s.fase === 'progreso' ? 'titulo-progreso' : 'titulo-resultados';
        $(titulo).focus({ preventScroll: true });
        irA('analizar');
    }
});

$('btn-otra').addEventListener('click', () => {
    actualizar({ fase: 'subida', archivo: null, error: null, falla: null, sel: null, datos: null, modelo: null });
    anunciar('Listo para analizar otra red');
    irA('analizar');
});

$('btn-inicio').addEventListener('click', () => {
    window.scrollTo(0, 0);
});
