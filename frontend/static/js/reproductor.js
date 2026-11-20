import { $, formatoEntero } from './dom.js';
import { estado, actualizar, suscribir, toca } from './estado.js';
import { ALGORITMOS } from './algoritmos.js';

const animacion = { cuadro: 0, ultimo: 0, avance: 0 };

function pasosActuales() {
    const algoritmo = ALGORITMOS.get(estado.modo);
    return algoritmo && estado.datos ? algoritmo.pasos(estado.datos) : [];
}

export function abrirPasos() {
    if (!pasosActuales().length) return;
    actualizar({ paso: 0, reproduciendo: true });
}

export function cerrarPasos() {
    actualizar({ paso: null, reproduciendo: false });
}

export function alternarReproduccion() {
    if (estado.paso === null) return;
    const alFinal = estado.paso >= pasosActuales().length;
    actualizar({ reproduciendo: !estado.reproduciendo, paso: alFinal ? 0 : estado.paso });
}

export function avanzarPaso(direccion) {
    if (estado.paso === null) return;
    const paso = Math.max(0, Math.min(pasosActuales().length, estado.paso + direccion));
    actualizar({ reproduciendo: false, paso });
}

function cuadro(ahora) {
    animacion.cuadro = 0;
    if (!estado.reproduciendo || estado.paso === null) return;
    const segundos = Math.min(0.1, (ahora - animacion.ultimo) / 1000);
    animacion.ultimo = ahora;
    animacion.avance += segundos * estado.velocidad;
    const saltos = Math.floor(animacion.avance);
    if (saltos > 0) {
        animacion.avance -= saltos;
        const total = pasosActuales().length;
        const siguiente = Math.min(total, estado.paso + saltos);
        actualizar({ paso: siguiente, reproduciendo: siguiente < total });
    }
    animacion.cuadro = requestAnimationFrame(cuadro);
}

function pintar(s) {
    const algoritmo = ALGORITMOS.get(s.modo);
    const pasos = algoritmo && s.datos ? algoritmo.pasos(s.datos) : [];
    $('reproductor').hidden = !pasos.length;
    $('complejidad').textContent = algoritmo ? algoritmo.complejidad : '';
    const activo = s.paso !== null;
    $('btn-pasos').setAttribute('aria-pressed', String(activo));
    $('btn-pasos').textContent = activo ? 'Ver resultado' : 'Paso a paso';
    $('controles-pasos').hidden = !activo;
    if (!activo || !pasos.length) return;

    const barra = $('barra-pasos');
    barra.max = String(pasos.length);
    barra.value = String(s.paso);
    $('contador-pasos').textContent = `Paso ${formatoEntero.format(s.paso)} de ${formatoEntero.format(pasos.length)}`;
    $('btn-reproducir').textContent = s.reproduciendo ? 'Pausar' : 'Reproducir';
    $('texto-paso').textContent = s.paso > 0
        ? algoritmo.textoPaso(pasos[s.paso - 1], s.datos, s.paso)
        : 'Listo para empezar';
    document.querySelectorAll('[data-velocidad]').forEach((boton) => {
        boton.setAttribute('aria-pressed', String(Number(boton.dataset.velocidad) === s.velocidad));
    });
}

suscribir((s, cambios) => {
    if (toca(cambios, 'modo', 'datos') && s.paso !== null && !('paso' in cambios)) {
        actualizar({ paso: null, reproduciendo: false });
        return;
    }
    if (toca(cambios, 'modo', 'datos', 'paso', 'reproduciendo', 'velocidad')) pintar(s);
    if (toca(cambios, 'reproduciendo') && s.reproduciendo && !animacion.cuadro) {
        animacion.ultimo = performance.now();
        animacion.avance = 0;
        animacion.cuadro = requestAnimationFrame(cuadro);
    }
});

$('btn-pasos').addEventListener('click', () => (estado.paso === null ? abrirPasos() : cerrarPasos()));
$('btn-reproducir').addEventListener('click', alternarReproduccion);
$('btn-paso-anterior').addEventListener('click', () => avanzarPaso(-1));
$('btn-paso-siguiente').addEventListener('click', () => avanzarPaso(1));
$('barra-pasos').addEventListener('input', (evento) => {
    const paso = Number(evento.target.value);
    actualizar({ reproduciendo: false, paso: Math.max(0, Math.min(pasosActuales().length, paso)) });
});
document.querySelectorAll('[data-velocidad]').forEach((boton) => {
    boton.addEventListener('click', () => actualizar({ velocidad: Number(boton.dataset.velocidad) }));
});
