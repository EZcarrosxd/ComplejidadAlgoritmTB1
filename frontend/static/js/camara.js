export const vista = { escala: 1, desplazamientoX: 0, desplazamientoY: 0, movida: false };

export const pantallaX = (posiciones, indice) => posiciones.x[indice] * vista.escala + vista.desplazamientoX;
export const pantallaY = (posiciones, indice) => posiciones.y[indice] * vista.escala + vista.desplazamientoY;

export function ajustar(posiciones, ancho, alto) {
    if (!posiciones || !posiciones.cantidad || !ancho || !alto) return;
    let minimoX = Infinity;
    let minimoY = Infinity;
    let maximoX = -Infinity;
    let maximoY = -Infinity;
    for (let i = 0; i < posiciones.cantidad; i++) {
        minimoX = Math.min(minimoX, posiciones.x[i]);
        minimoY = Math.min(minimoY, posiciones.y[i]);
        maximoX = Math.max(maximoX, posiciones.x[i]);
        maximoY = Math.max(maximoY, posiciones.y[i]);
    }
    const anchoGrafo = Math.max(maximoX - minimoX, 1);
    const altoGrafo = Math.max(maximoY - minimoY, 1);
    const escala = Math.max(0.2, Math.min((ancho - 80) / anchoGrafo, (alto - 160) / altoGrafo, 6));
    vista.escala = escala;
    vista.desplazamientoX = ancho / 2 - (minimoX + anchoGrafo / 2) * escala;
    vista.desplazamientoY = alto / 2 + 10 - (minimoY + altoGrafo / 2) * escala;
}

export function zoomEn(punto, factor) {
    const nuevaEscala = Math.max(0.2, Math.min(10, vista.escala * factor));
    const proporcion = nuevaEscala / vista.escala;
    vista.desplazamientoX = punto.x - (punto.x - vista.desplazamientoX) * proporcion;
    vista.desplazamientoY = punto.y - (punto.y - vista.desplazamientoY) * proporcion;
    vista.escala = nuevaEscala;
    vista.movida = true;
}

export function nodoEn(posiciones, punto) {
    if (!posiciones) return -1;
    let mejor = -1;
    let distanciaMinimaAlCuadrado = 144;
    for (let i = 0; i < posiciones.cantidad; i++) {
        const diferenciaX = pantallaX(posiciones, i) - punto.x;
        const diferenciaY = pantallaY(posiciones, i) - punto.y;
        const distanciaAlCuadrado = diferenciaX ** 2 + diferenciaY ** 2;
        if (distanciaAlCuadrado < distanciaMinimaAlCuadrado) {
            distanciaMinimaAlCuadrado = distanciaAlCuadrado;
            mejor = i;
        }
    }
    return mejor;
}
