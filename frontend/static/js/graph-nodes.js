import { GRAPH } from './graph-options.js';

export function crearNodos(datos) {
    const grafo = datos.grafo_visual;
    const criticos = new Set(datos.nodos_criticos || []);

    const nodos = grafo.nodos.map((n) => {
        const esCritico = criticos.has(n.id);
        const c = esCritico ? GRAPH.critico : GRAPH.normal;
        return {
            id: n.id,
            label: n.label ?? String(n.id),
            shape: esCritico ? 'diamond' : 'dot',
            size: esCritico ? 20 : 13,
            title: esCritico ? `${n.id}: nodo crítico` : `${n.id}: nodo eléctrico`,
            color: {
                background: c.fill,
                border: c.stroke,
                highlight: { background: c.fill, border: '#0f172a' },
                hover: { background: c.fill, border: '#0f172a' }
            }
        };
    });
    return nodos;
}
