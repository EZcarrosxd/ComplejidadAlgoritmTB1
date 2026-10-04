export const GRAPH = {
    normal:  { fill: '#3b82f6', stroke: '#1d4ed8' },
    critico: { fill: '#dc2626', stroke: '#991b1b' },
    arista: '#c3cbd8', aristaHover: '#8b97ab', aristaSel: '#1258e2',
    texto: '#3a4659', halo: '#f5f7fa'
};
export const opciones = {
    nodes: {
        borderWidth: 2,
        borderWidthSelected: 4,
        font: {
            size: 11, face: 'IBM Plex Mono, ui-monospace, monospace',
            color: GRAPH.texto, strokeWidth: 3, strokeColor: GRAPH.halo
        }
    },
    edges: {
        width: 1,
        selectionWidth: 2,
        smooth: false,
        color: { color: GRAPH.arista, hover: GRAPH.aristaHover, highlight: GRAPH.aristaSel }
    },
    interaction: { hover: true, tooltipDelay: 120 },
    physics: {
        barnesHut: { gravitationalConstant: -2000, centralGravity: 0.3, springLength: 95 }
    }
};
