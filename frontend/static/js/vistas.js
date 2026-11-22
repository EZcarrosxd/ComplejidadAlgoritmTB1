import { $, anunciar, irA } from './dom.js';
import { actualizar, suscribir, toca } from './estado.js';

suscribir((estado, cambios) => {
    if (!toca(cambios, 'fase')) return;
    const subiendo = estado.fase === 'subida';
    $('inicio').hidden = !subiendo;
    $('espacio-trabajo').hidden = subiendo;
    $('vista-geografica').hidden = subiendo;
    $('btn-otra').hidden = subiendo;
    $(subiendo ? 'archivo' : 'titulo-geografica').focus({ preventScroll: true });
    if (!subiendo) irA('analizar');
});

function volverAlInicio() {
    actualizar({ fase: 'subida', redGeografica: null, error: null });
    anunciar('Listo para cargar otra red');
    irA('analizar');
}

$('btn-otra').addEventListener('click', volverAlInicio);
$('btn-inicio').addEventListener('click', () => {
    if (!$('inicio').hidden) window.scrollTo(0, 0);
    else volverAlInicio();
});
