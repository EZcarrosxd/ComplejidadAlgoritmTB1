import { $, crear, fmtInt, fmtMoney, fmtSeg } from './dom.js';
import { suscribir, toca } from './state.js';
import { animarNumero } from './countup.js';
import { cambiarModo } from './actions.js';

const MODOS = ['general', 'mst', 'flow', 'fallas'];
const CAPTION = {
    general: 'Arrastra para moverte. Haz clic en un punto para ver sus datos.',
    mst: 'En verde, el cableado más barato.',
    flow: 'Haz clic en dos puntos para medir la capacidad entre ellos.',
    fallas: 'Haz clic en un punto para ver qué pasa si falla.',
};
const LEYENDA = { general: 'Línea', mst: 'Cableado más barato', flow: 'Corriente', fallas: 'Zona sin luz' };
const COLOR = { general: 'var(--ink)', mst: 'var(--lime)', flow: 'var(--amber)', fallas: 'var(--red)' };

let mostrados = null;

function pintarHechos(meta, tiempo) {
    const filas = [
        ['Puntos', fmtInt.format(meta.total_nodos), ''],
        ['Líneas', fmtInt.format(meta.total_aristas), ''],
        ['Estado', meta.red_conectada ? 'Conectada' : `${meta.componentes} partes`, meta.red_conectada ? 'ok' : 'warn-text'],
        ['Cálculo', `${fmtSeg.format(tiempo)} s`, ''],
    ];
    $('datos-red').replaceChildren(...filas.map(([clave, valor, clase]) => {
        const fila = crear('div');
        fila.append(crear('dt', '', clave), crear('dd', clase, valor));
        return fila;
    }));
}

function pintarDatos(datos, anterior) {
    const meta = datos.metadata;
    pintarHechos(meta, datos.tiempo_ejecucion);
    const entero = Number.isInteger(datos.flujo_maximo_red);
    const formatoFlujo = (v) => (entero ? fmtInt.format(Math.round(v)) : fmtMoney.format(v));
    if (!anterior) {
        animarNumero($('val-costo'), datos.costo_minimo_instalacion, (v) => fmtMoney.format(v));
        animarNumero($('val-criticos'), datos.nodos_criticos.length, (v) => fmtInt.format(Math.round(v)));
    }
    animarNumero($('val-flujo'), datos.flujo_maximo_red, formatoFlujo, anterior ? anterior.flujo_maximo_red : 0);
    $('graph-count').textContent =
        `Mostrando ${fmtInt.format(datos.grafo_visual.nodos.length)} de ${fmtInt.format(meta.total_nodos)} puntos`;
}

function pintarModo(modo) {
    document.querySelectorAll('.tab').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.modo === modo)));
    document.querySelectorAll('.metric').forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.modo === modo)));
    $('caption').textContent = CAPTION[modo];
    $('leyenda-linea').textContent = LEYENDA[modo];
    $('leyenda-color').style.background = COLOR[modo];
    $('grafo').setAttribute('aria-label', `Mapa de la red. ${CAPTION[modo]}`);
    MODOS.forEach((m) => { $(`panel-${m}`).hidden = m !== modo; });
}

suscribir((s, cambios) => {
    if (toca(cambios, 'datos') && s.datos) {
        pintarDatos(s.datos, toca(cambios, 'fase') ? null : mostrados);
        mostrados = s.datos;
    }
    if (toca(cambios, 'modo')) pintarModo(s.modo);
});

document.querySelectorAll('.tab, .metric').forEach((boton) => {
    boton.addEventListener('click', () => cambiarModo(boton.dataset.modo));
});
