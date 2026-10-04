import { $, fmtInt, reduceMotion } from './dom.js';
import { opciones } from './graph-options.js';
import { crearNodos } from './graph-nodes.js';
let network = null;

export function localizarNodo(id) {
    if (!network) return;
    network.selectNodes([id]);
    network.focus(id, {
        scale: 1.3,
        animation: reduceMotion() ? false : { duration: 450, easingFunction: 'easeInOutQuad' }
    });
}

function mostrarGrafoVacio(mensaje) {
    $('network-container').hidden = true;
    const vacio = $('network-empty');
    vacio.textContent = mensaje;
    vacio.hidden = false;
}

export function dibujarGrafo(datos) {
    if (network) { network.destroy(); network = null; }

    const contenedor = $('network-container');
    const grafo = datos.grafo_visual;

    contenedor.hidden = false;
    $('network-empty').hidden = true;

    if (!grafo || !grafo.nodos || grafo.nodos.length === 0) {
        $('graph-sub').textContent = 'Subgrafo representativo';
        mostrarGrafoVacio('Datos visuales no disponibles.');
        return;
    }

    const total = datos.metadata && datos.metadata.total_nodos;
    $('graph-sub').textContent = total
        ? `Mostrando ${fmtInt.format(grafo.nodos.length)} de ${fmtInt.format(total)} nodos eléctricos`
        : `Mostrando ${fmtInt.format(grafo.nodos.length)} nodos eléctricos`;

    if (typeof vis === 'undefined') {
        mostrarGrafoVacio('No se pudo cargar la librería de visualización. Revisa tu conexión a internet y recarga la página.');
        return;
    }

    const nodos = crearNodos(datos);


    network = new vis.Network(
        contenedor,
        { nodes: new vis.DataSet(nodos), edges: new vis.DataSet(grafo.aristas) },
        opciones
    );

    network.once('stabilizationIterationsDone', () => network.setOptions({ physics: false }));
}

export function destruirGrafo() {
    if (network) network.destroy();
    network = null;
}

export function ajustarGrafo() {
    if (!network) return;
    network.unselectAll();
    network.fit({ animation: !reduceMotion() });
}
