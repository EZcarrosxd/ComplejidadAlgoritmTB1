const ARISTAS_POR_LOTE = 256;
const COLOR_CANDIDATA = 'rgba(167, 82, 36, .53)';
const COLOR_TRAMO = '#00578b';
const COLOR_ESTRUCTURA = 'rgba(36, 69, 94, .82)';
const COLOR_DESCARTADA = 'rgba(160, 152, 140, .35)';
const COLOR_ARBOL = '#2F6430';

function limitesGeograficos(grafo) {
    let oeste = Infinity, sur = Infinity, este = -Infinity, norte = -Infinity;
    function considerar([longitud, latitud]) {
        oeste = Math.min(oeste, longitud);
        este = Math.max(este, longitud);
        sur = Math.min(sur, latitud);
        norte = Math.max(norte, latitud);
    }
    grafo.nodos.forEach(considerar);
    for (const trazado of grafo.tramos) trazado.forEach(considerar);
    return { oeste, sur, este, norte };
}

export function crearEscena(grafo) {
    const { oeste, sur, este, norte } = limitesGeograficos(grafo);
    const centroLon = (oeste + este) / 2;
    const centroLat = (sur + norte) / 2;
    const factorLon = Math.cos(centroLat * Math.PI / 180);

    function aPlano(puntos) {
        const plano = new Float64Array(puntos.length * 2);
        puntos.forEach(([longitud, latitud], i) => {
            plano[2 * i] = (longitud - centroLon) * factorLon;
            plano[2 * i + 1] = centroLat - latitud;
        });
        return plano;
    }

    return {
        ids: grafo.ids,
        coordenadas: grafo.nodos,
        nodos: aPlano(grafo.nodos),
        tramos: grafo.tramos.map(aPlano),
        candidatas: grafo.candidatas.map(aPlano),
        anchoPlano: (este - oeste) * factorLon,
        altoPlano: norte - sur,
    };
}

export function encuadrar(escena, ancho, alto) {
    const margen = Math.max(8, Math.min(ancho, alto) * 0.035);
    const escala = Math.min(
        (ancho - 2 * margen) / Math.max(escena.anchoPlano, 1e-10),
        (alto - 2 * margen) / Math.max(escena.altoPlano, 1e-10),
    );
    return { escala, x: ancho / 2, y: alto / 2 };
}

export const metrosPorGrado = 111320;

function dibujarLineas(contexto, caminos, camara, ancho, alto, color, grosor, guiones = []) {
    const { escala, x, y } = camara;
    contexto.strokeStyle = color;
    contexto.lineWidth = grosor;
    contexto.setLineDash(guiones);
    let enLote = 0;
    contexto.beginPath();
    for (const camino of caminos) {
        const ultimo = camino.length - 2;
        const x1 = camino[0] * escala + x, y1 = camino[1] * escala + y;
        const x2 = camino[ultimo] * escala + x, y2 = camino[ultimo + 1] * escala + y;
        const fuera = camino.length === 4 &&
            (Math.max(x1, x2) < 0 || Math.min(x1, x2) > ancho || Math.max(y1, y2) < 0 || Math.min(y1, y2) > alto);
        if (fuera) continue;
        contexto.moveTo(x1, y1);
        for (let i = 2; i < camino.length; i += 2) {
            contexto.lineTo(camino[i] * escala + x, camino[i + 1] * escala + y);
        }
        if (++enLote === ARISTAS_POR_LOTE) {
            contexto.stroke();
            contexto.beginPath();
            enLote = 0;
        }
    }
    contexto.stroke();
}

export function caminosSeleccionados(escena, indices) {
    const cantidadTramos = escena.tramos.length;
    return indices.map((indice) => (indice < cantidadTramos
        ? escena.tramos[indice]
        : escena.candidatas[indice - cantidadTramos]));
}

export function dibujarRed(contexto, escena, camara, ancho, alto, aumento = 1, arbol = null) {
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, ancho, alto);
    contexto.lineJoin = 'round';
    if (arbol) {
        dibujarLineas(contexto, escena.candidatas, camara, ancho, alto, COLOR_DESCARTADA, 0.6);
        dibujarLineas(contexto, escena.tramos, camara, ancho, alto, COLOR_DESCARTADA, 0.6);
        dibujarLineas(contexto, arbol, camara, ancho, alto, COLOR_ARBOL, 1.6);
    } else {
        dibujarLineas(contexto, escena.candidatas, camara, ancho, alto, COLOR_CANDIDATA, 0.8, [2.5, 1.7]);
        dibujarLineas(contexto, escena.tramos, camara, ancho, alto, COLOR_TRAMO, 1.45);
    }

    const radio = 1.3 * Math.min(3, Math.sqrt(Math.max(1, aumento)));
    contexto.fillStyle = COLOR_ESTRUCTURA;
    const { escala, x, y } = camara;
    contexto.beginPath();
    for (let i = 0; i < escena.nodos.length; i += 2) {
        const px = escena.nodos[i] * escala + x, py = escena.nodos[i + 1] * escala + y;
        if (px < -radio || px > ancho + radio || py < -radio || py > alto + radio) continue;
        contexto.moveTo(px + radio, py);
        contexto.arc(px, py, radio, 0, 2 * Math.PI);
    }
    contexto.fill();
}

export function nodoCercano(escena, camara, punto, distanciaMaxima = 10) {
    let mejor = -1;
    let mejorDistancia = distanciaMaxima ** 2;
    for (let i = 0; i < escena.nodos.length; i += 2) {
        const dx = escena.nodos[i] * camara.escala + camara.x - punto.x;
        const dy = escena.nodos[i + 1] * camara.escala + camara.y - punto.y;
        const distancia = dx * dx + dy * dy;
        if (distancia < mejorDistancia) {
            mejorDistancia = distancia;
            mejor = i / 2;
        }
    }
    return mejor;
}
