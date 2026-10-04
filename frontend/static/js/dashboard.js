import { $, fmtInt, fmtDecimal, fmtMoney, fmtTime } from './dom.js';
import { idChip } from './chip.js';
import { renderCriticos } from './critical-nodes.js';
import { renderCorte } from './cut.js';

function llenarListaNodos(ids) {
    const lista = $('lista-nodos');
    lista.replaceChildren(...ids.map((id) => {
        const opcion = document.createElement('option');
        opcion.value = id;
        return opcion;
    }));
}

export function poblarDashboard(datos, nombreArchivo) {
    const meta = datos.metadata || {};
    const criticos = datos.nodos_criticos || [];
    const visibles = new Set(((datos.grafo_visual && datos.grafo_visual.nodos) || []).map((n) => n.id));

    $('file-name').textContent = nombreArchivo;

    $('fact-nodos').textContent = fmtInt.format(meta.total_nodos ?? 0);
    $('fact-aristas').textContent = fmtInt.format(meta.total_aristas ?? 0);
    $('fact-tiempo').textContent = `${fmtTime.format(datos.tiempo_ejecucion ?? 0)} s`;

    $('val-costo').textContent = fmtMoney.format(datos.costo_minimo_instalacion);
    $('mst-note').textContent = meta.red_conectada
        ? 'Árbol de expansión mínima, calculado con Kruskal.'
        : `Red desconectada: bosque mínimo de ${meta.componentes} componentes.`;
    $('val-flujo').textContent = fmtDecimal.format(datos.flujo_maximo_red);
    $('flow-note').replaceChildren(
        'Entre ', idChip(meta.origen_flujo ?? '–'), ' y ', idChip(meta.destino_flujo ?? '–'),
        meta.seleccion_flujo === 'automatica'
            ? ' (extremos aproximados por BFS), calculado con Ford-Fulkerson.'
            : ', calculado con Ford-Fulkerson.'
    );
    renderCorte(datos.lineas_corte_minimo || []);

    $('flow-origen').value = meta.origen_flujo ?? '';
    $('flow-destino').value = meta.destino_flujo ?? '';
    $('flow-error').hidden = true;
    llenarListaNodos(meta.ids_nodos || []);

    $('val-criticos-count').textContent = fmtInt.format(criticos.length);
    $('critical-of').textContent = meta.total_nodos ? `de ${fmtInt.format(meta.total_nodos)}` : '';
    renderCriticos(criticos, visibles);
}
