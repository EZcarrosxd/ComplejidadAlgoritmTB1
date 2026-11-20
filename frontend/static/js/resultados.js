import { $, crear, formatoEntero, formatoSegundos } from './dom.js';
import { suscribir, toca } from './estado.js';
import { cambiarModo } from './acciones.js';
import { ALGORITMOS, CATALOGO } from './algoritmos.js';

const PANELES_PROPIOS = ['general', 'mst', 'flujo', 'fallas'];

function pintarHechos(meta, tiempo) {
    const filas = [
        ['Puntos', formatoEntero.format(meta.total_nodos), ''],
        ['Líneas', formatoEntero.format(meta.total_aristas), ''],
        ['Estado', meta.red_conectada ? 'Conectada' : `${meta.componentes} partes`, meta.red_conectada ? 'ok' : 'warn-text'],
        ['Cálculo', `${formatoSegundos.format(tiempo)} s`, ''],
    ];
    $('datos-red').replaceChildren(...filas.map(([clave, valor, clase]) => {
        const fila = crear('div');
        fila.append(crear('dt', '', clave), crear('dd', clase, valor));
        return fila;
    }));
}

function crearOpcion(algoritmo) {
    const boton = crear('button', 'opcion');
    boton.type = 'button';
    boton.dataset.modo = algoritmo.id;
    boton.style.setProperty('--c', algoritmo.color);
    boton.setAttribute('aria-pressed', 'false');
    const nombre = crear('span', 'opcion-nombre');
    nombre.append(crear('span', 'opcion-titulo', algoritmo.nombre), crear('span', 'opcion-tecnica', algoritmo.tecnica));
    const valor = crear('span', 'opcion-valor');
    valor.id = `valor-${algoritmo.id}`;
    boton.append(nombre, valor);
    boton.addEventListener('click', () => cambiarModo(algoritmo.id));
    return boton;
}

function pintarDatos(datos) {
    const meta = datos.metadata;
    pintarHechos(meta, datos.tiempo_ejecucion);
    for (const algoritmo of CATALOGO) $(`valor-${algoritmo.id}`).textContent = algoritmo.valor(datos);
    $('graph-count').textContent =
        `Mostrando ${formatoEntero.format(datos.grafo_visual.nodos.length)} de ${formatoEntero.format(meta.total_nodos)} puntos`;
}

function pintarModo(modo) {
    const algoritmo = ALGORITMOS.get(modo);
    document.querySelectorAll('.opcion').forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.modo === modo)));
    $('caption').textContent = algoritmo.problema;
    $('leyenda-linea').textContent = algoritmo.leyenda;
    $('leyenda-color').style.background = algoritmo.color;
    $('grafo').setAttribute('aria-label', `Mapa de la red, ${algoritmo.nombre}`);
    PANELES_PROPIOS.forEach((m) => { $(`panel-${m}`).hidden = m !== modo; });
    $('panel-algoritmo').hidden = PANELES_PROPIOS.includes(modo);
}

$('opciones').replaceChildren(...CATALOGO.map(crearOpcion));

suscribir((s, cambios) => {
    if (toca(cambios, 'datos') && s.datos) pintarDatos(s.datos);
    if (toca(cambios, 'modo')) pintarModo(s.modo);
});
