export function calcularLimites(camara, ancho, alto, margen = 0) {
    const { escala, x, y } = camara;
    return { minX: (-margen - x) / escala, maxX: (ancho + margen - x) / escala,
        minY: (-margen - y) / escala, maxY: (alto + margen - y) / escala };
}

export function dentroDeVista(arista, vista) {
    return arista.minX <= vista.maxX && arista.maxX >= vista.minX
        && arista.minY <= vista.maxY && arista.maxY >= vista.minY;
}

export function* nodosEnVista(escena, vista) {
    const { indiceNodos, nodos } = escena;
    let desde = 0, hasta = indiceNodos.length;
    while (desde < hasta) {
        const medio = Math.floor((desde + hasta) / 2);
        if (nodos[2 * indiceNodos[medio]] < vista.minX) desde = medio + 1;
        else hasta = medio;
    }
    for (let i = desde; i < indiceNodos.length; i++) {
        const indice = indiceNodos[i];
        if (nodos[2 * indice] > vista.maxX) break;
        const y = nodos[2 * indice + 1];
        if (y >= vista.minY && y <= vista.maxY) yield indice;
    }
}
