import { $, crear, formatoEntero, formatoMoneda, formatoSegundos } from './dom.js';
import { suscribir, toca } from './estado.js';
import { cambiarModo } from './acciones.js';

const MODOS = ['general', 'mst', 'flujo', 'fallas'];
const INDICACIONES = {
    general: 'Arrastra para moverte y haz clic en un punto para ver sus datos',
    mst: 'En verde, el cableado más barato',
    flujo: 'Haz clic en dos puntos para medir la capacidad entre ellos',
    fallas: 'Haz clic en un punto para ver qué pasa si falla',
};
const LEYENDA = { general: 'Línea', mst: 'Cableado más barato', flujo: 'Corriente', fallas: 'Zona sin luz' };
const COLOR = { general: 'var(--ink)', mst: 'var(--lime)', flujo: 'var(--amber)', fallas: 'var(--red)' };

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

function pintarDatos(datos) {
    const meta = datos.metadata;
    pintarHechos(meta, datos.tiempo_ejecucion);
    $('val-costo').textContent = formatoMoneda.format(datos.costo_minimo_instalacion);
    $('val-criticos').textContent = formatoEntero.format(datos.nodos_criticos.length);
    const formatoFlujo = Number.isInteger(datos.flujo_maximo_red) ? formatoEntero : formatoMoneda;
    $('val-flujo').textContent = formatoFlujo.format(datos.flujo_maximo_red);
    $('graph-count').textContent =
        `Mostrando ${formatoEntero.format(datos.grafo_visual.nodos.length)} de ${formatoEntero.format(meta.total_nodos)} puntos`;
}

function pintarModo(modo) {
    document.querySelectorAll('.metric').forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.modo === modo)));
    $('caption').textContent = INDICACIONES[modo];
    $('leyenda-linea').textContent = LEYENDA[modo];
    $('leyenda-color').style.background = COLOR[modo];
    $('grafo').setAttribute('aria-label', `Mapa de la red, ${INDICACIONES[modo]}`);
    MODOS.forEach((m) => { $(`panel-${m}`).hidden = m !== modo; });
}

suscribir((s, cambios) => {
    if (toca(cambios, 'datos') && s.datos) pintarDatos(s.datos);
    if (toca(cambios, 'modo')) pintarModo(s.modo);
});

document.querySelectorAll('.metric').forEach((boton) => {
    boton.addEventListener('click', () => cambiarModo(boton.dataset.modo));
});
