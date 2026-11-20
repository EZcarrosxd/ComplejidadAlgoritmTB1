import { $, crear, formatoEntero } from './dom.js';
import { suscribir, toca } from './estado.js';
import { cambiarModo } from './acciones.js';
import { ALGORITMOS, GRUPOS, grupoDe, responder } from './algoritmos.js';

const PANELES = { flujo: 'panel-flujo', fallas: 'panel-fallas' };

function crearBoton(clase, texto, modo, color) {
    const boton = crear('button', clase, texto);
    boton.type = 'button';
    boton.dataset.modo = modo;
    boton.style.setProperty('--c', color);
    boton.setAttribute('aria-pressed', 'false');
    boton.addEventListener('click', () => cambiarModo(modo));
    return boton;
}

function pintarPreguntas() {
    $('preguntas').replaceChildren(...GRUPOS.map((grupo) =>
        crearBoton('pregunta', grupo.nombre, grupo.metodos[0], ALGORITMOS.get(grupo.metodos[0]).color)));
}

function pintarMetodos(grupo) {
    const metodos = grupo.metodos.length > 1
        ? grupo.metodos.map((modo) => crearBoton('metodo', ALGORITMOS.get(modo).nombre, modo, ALGORITMOS.get(modo).color))
        : [];
    $('metodos').replaceChildren(...metodos);
}

function pintarRespuesta(s) {
    const algoritmo = ALGORITMOS.get(s.modo);
    const grupo = grupoDe(s.modo);
    const [valor, detalle] = responder(s.modo, s.datos);
    $('pregunta').textContent = grupo.pregunta;
    const espacio = valor.startsWith('S/') ? -1 : valor.indexOf(' ');
    $('respuesta-valor').replaceChildren(
        espacio < 0 ? valor : valor.slice(0, espacio),
        ...(espacio < 0 ? [] : [crear('span', 'respuesta-unidad', valor.slice(espacio + 1))]),
    );
    $('respuesta-valor').style.setProperty('--c', algoritmo.color);
    $('respuesta-detalle').textContent = detalle;
    if (grupo.metodos.join() !== $('metodos').dataset.grupo) {
        pintarMetodos(grupo);
        $('metodos').dataset.grupo = grupo.metodos.join();
    }
    document.querySelectorAll('.pregunta').forEach((boton) => {
        boton.setAttribute('aria-pressed', String(grupoDe(boton.dataset.modo) === grupo));
    });
    document.querySelectorAll('.metodo').forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.modo === s.modo)));
}

function pintarMapa(s) {
    const algoritmo = ALGORITMOS.get(s.modo);
    $('leyenda-linea').textContent = algoritmo.leyenda;
    $('leyenda-color').style.background = algoritmo.color;
    $('grafo').setAttribute('aria-label', `Mapa de la red, ${algoritmo.nombre}`);
    const meta = s.datos.metadata;
    $('graph-count').textContent = meta.red_conectada
        ? `${formatoEntero.format(meta.total_nodos)} puntos`
        : `${formatoEntero.format(meta.total_nodos)} puntos en ${meta.componentes} partes`;
}

function pintarPaneles(s) {
    const enPasos = s.paso !== null;
    $('panel-flujo').hidden = enPasos || s.modo !== 'flujo';
    $('panel-fallas').hidden = enPasos || s.modo !== 'fallas';
    $('panel-general').hidden = enPasos || Boolean(PANELES[s.modo]);
}

pintarPreguntas();

suscribir((s, cambios) => {
    if (!s.datos) return;
    if (toca(cambios, 'modo', 'datos')) {
        pintarRespuesta(s);
        pintarMapa(s);
    }
    if (toca(cambios, 'modo', 'paso')) pintarPaneles(s);
});
