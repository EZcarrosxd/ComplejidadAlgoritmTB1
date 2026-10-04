import { $, anunciar } from './dom.js';
import { estado, actualizar, suscribir, toca } from './state.js';

const fondo = $('ayuda');
let enfocadoAntes = null;

export function abrirAyuda() {
    enfocadoAntes = document.activeElement;
    actualizar({ ayuda: true });
}

export function cerrarAyuda() {
    actualizar({ ayuda: false });
}

suscribir((s, cambios) => {
    const raiz = document.documentElement;
    if (toca(cambios, 'ayuda')) {
        fondo.hidden = !s.ayuda;
        if (s.ayuda) setTimeout(() => $('btn-cerrar-ayuda').focus(), 30);
        else if (enfocadoAntes) enfocadoAntes.focus();
    }
    if (toca(cambios, 'grande')) {
        raiz.classList.toggle('texto-grande', s.grande);
        $('btn-texto-grande').setAttribute('aria-pressed', String(s.grande));
    }
    if (toca(cambios, 'quieto')) {
        raiz.classList.toggle('sin-animaciones', s.quieto);
        $('btn-animaciones').setAttribute('aria-pressed', String(!s.quieto));
    }
});

$('btn-ayuda').addEventListener('click', abrirAyuda);
$('btn-cerrar-ayuda').addEventListener('click', cerrarAyuda);
fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrarAyuda(); });

fondo.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const enfocables = fondo.querySelectorAll('button');
    const primero = enfocables[0], ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
});

$('btn-texto-grande').addEventListener('click', () => {
    const grande = !estado.grande;
    actualizar({ grande });
    anunciar(grande ? 'Texto grande activado' : 'Texto normal');
});

$('btn-animaciones').addEventListener('click', () => {
    const quieto = !estado.quieto;
    actualizar({ quieto });
    anunciar(quieto ? 'Animaciones desactivadas' : 'Animaciones activadas');
});
