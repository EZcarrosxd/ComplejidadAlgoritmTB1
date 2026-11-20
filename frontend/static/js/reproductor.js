import { $, crear, formatoEntero } from './dom.js';
import { estado, actualizar, suscribir, toca } from './estado.js';
import { ALGORITMOS } from './algoritmos.js';

const DURACION_RECORRIDO = 20;
const animacion = { cuadro: 0, ultimo: 0, avance: 0 };

function pasosActuales() {
    const algoritmo = ALGORITMOS.get(estado.modo);
    return algoritmo && estado.datos ? algoritmo.pasos(estado.datos) : [];
}

const limitar = (paso) => Math.max(0, Math.min(pasosActuales().length, paso));

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
    actualizar({ reproduciendo: false, paso: limitar(estado.paso + direccion) });
}

function cuadro(ahora) {
    animacion.cuadro = 0;
    if (!estado.reproduciendo || estado.paso === null) return;
    const total = pasosActuales().length;
    const velocidad = Math.max(2, total / DURACION_RECORRIDO);
    animacion.avance += Math.min(0.1, (ahora - animacion.ultimo) / 1000) * velocidad;
    animacion.ultimo = ahora;
    const saltos = Math.floor(animacion.avance);
    if (saltos > 0) {
        animacion.avance -= saltos;
        const siguiente = Math.min(total, estado.paso + saltos);
        actualizar({ paso: siguiente, reproduciendo: siguiente < total });
    }
    animacion.cuadro = requestAnimationFrame(cuadro);
}

function pintar(s) {
    const algoritmo = ALGORITMOS.get(s.modo);
    const pasos = algoritmo && s.datos ? algoritmo.pasos(s.datos) : [];
    const activo = s.paso !== null && pasos.length > 0;
    $('btn-pasos').hidden = activo;
    $('btn-pasos').disabled = !pasos.length;
    $('controles-pasos').hidden = !activo;
    if (!activo) return;

    $('complejidad').replaceChildren(crear('strong', '', algoritmo.nombre), crear('span', '', algoritmo.complejidad));
    const barra = $('barra-pasos');
    barra.max = String(pasos.length);
    barra.value = String(s.paso);
    $('contador-pasos').textContent = `${formatoEntero.format(s.paso)} de ${formatoEntero.format(pasos.length)}`;
    $('btn-reproducir').textContent = s.reproduciendo ? 'Pausar' : 'Reproducir';
    $('texto-paso').textContent = s.paso > 0 ? algoritmo.textoPaso(pasos[s.paso - 1], s.datos, s.paso) : 'Listo para empezar';
}

suscribir((s, cambios) => {
    if (toca(cambios, 'modo', 'datos') && s.paso !== null && !('paso' in cambios)) {
        actualizar({ paso: null, reproduciendo: false });
        return;
    }
    if (toca(cambios, 'modo', 'datos', 'paso', 'reproduciendo')) pintar(s);
    if (toca(cambios, 'reproduciendo') && s.reproduciendo && !animacion.cuadro) {
        animacion.ultimo = performance.now();
        animacion.avance = 0;
        animacion.cuadro = requestAnimationFrame(cuadro);
    }
});

$('btn-pasos').addEventListener('click', abrirPasos);
$('btn-salir-pasos').addEventListener('click', cerrarPasos);
$('btn-reproducir').addEventListener('click', alternarReproduccion);
$('btn-paso-anterior').addEventListener('click', () => avanzarPaso(-1));
$('btn-paso-siguiente').addEventListener('click', () => avanzarPaso(1));
$('barra-pasos').addEventListener('input', (evento) => {
    actualizar({ reproduciendo: false, paso: limitar(Number(evento.target.value)) });
});
