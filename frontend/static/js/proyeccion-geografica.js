import { dibujarNombres, dibujarPesos, espacioParaRotulos, prepararRotulos } from './rotulos-geograficos.js';
import { prepararProyeccion } from './proyeccion-longitudes.js';
import { calcularLimites, dentroDeVista, nodosEnVista } from './espacio-geografico.js';

const ARISTAS_POR_LOTE = 256;
const COLOR_CANDIDATA = '#616161';
const COLOR_CANDIDATA_GENERAL = 'rgba(70, 70, 70, .26)';
const COLOR_TRAMO = '#171717';
const COLOR_NODO = '#171717';
const COLOR_DESCARTADA = 'rgba(100, 100, 100, .28)';
const COLOR_ARBOL = '#2F6430';
const COLOR_ARBOL_CANDIDATA_GENERAL = 'rgba(47, 100, 48, .55)';
const GUIONES_CANDIDATA = [5, 4];
const UMBRAL_ELEMENTOS_TRES = 40_000;
const UMBRAL_COBERTURA_TRES = 2;

export function crearEscena(grafo) {
    const coordenadas = grafo.nodos.map((nodo) => nodo.coordenadas);
    const posiciones = new Map(grafo.nodos.map((nodo) => [nodo.id, nodo.coordenadas]));
    const caminoOriginal = (arista) => arista.trazado ?? [posiciones.get(arista.origen), posiciones.get(arista.destino)];
    const { aPlano, proyectarCamino, anchoPlano, altoPlano } = prepararProyeccion(grafo, caminoOriginal);
    const nodos = aPlano(coordenadas);
    const aristas = new Map();
    let segmentos = 0, longitudPlano = 0;
    for (const arista of grafo.aristas) {
        const { id, clase, peso_mm: peso } = arista;
        const caminos = proyectarCamino(caminoOriginal(arista));
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const camino of caminos) {
            segmentos += camino.length / 2 - 1;
            for (let i = 0; i < camino.length; i += 2) {
                const x = camino[i], y = camino[i + 1];
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                if (i) longitudPlano += Math.hypot(x - camino[i - 2], y - camino[i - 1]);
            }
        }
        aristas.set(id, { id, clase, peso, caminos, minX, maxX, minY, maxY });
    }
    const indiceNodos = Uint32Array.from(grafo.nodos, (_, i) => i);
    indiceNodos.sort((a, b) => nodos[2 * a] - nodos[2 * b] || nodos[2 * a + 1] - nodos[2 * b + 1]);
    return {
        ids: grafo.nodos.map((nodo) => nodo.id),
        coordenadas,
        nodos,
        indiceNodos,
        aristas,
        ...agruparAristas(aristas.values()),
        anchoPlano,
        altoPlano,
        segmentos,
        longitudPlano,
    };
}

export function encuadrar(escena, ancho, alto, margenVertical = 0) {
    const margen = Math.max(8, Math.min(ancho, alto) * 0.035);
    const margenRotulos = escena.ids.length <= espacioParaRotulos(ancho, alto) ? 60 : 0;
    const margenHorizontal = Math.max(margen, margenRotulos);
    const margenAlto = Math.max(margenHorizontal, margenVertical + (margenRotulos ? 43 : 0));
    const escala = Math.min(
        Math.max(1, ancho - 2 * margenHorizontal) / Math.max(escena.anchoPlano, 0.0001),
        Math.max(1, alto - 2 * margenAlto) / Math.max(escena.altoPlano, 0.0001),
    );
    return { escala, x: ancho / 2, y: alto / 2 };
}

export const metrosPorGrado = 111320;

export function elegirMotor(escena, ajuste, ancho, alto) {
    const elementos = escena.ids.length + escena.segmentos;
    const area = ancho * alto;
    const exigente = elementos >= UMBRAL_ELEMENTOS_TRES ||
        escena.longitudPlano * ajuste.escala >= UMBRAL_COBERTURA_TRES * area;
    return exigente ? 'three' : 'canvas';
}

export function conservarCentro(camara, anterior, ajuste, ancho, alto) {
    const proporcion = ajuste.escala / anterior.escala;
    return {
        escala: camara.escala * proporcion,
        x: ancho / 2 - (anterior.x - camara.x) * proporcion,
        y: alto / 2 - (anterior.y - camara.y) * proporcion,
    };
}

function dibujarLineas(contexto, aristas, camara, ancho, alto, color, grosor, guiones = []) {
    const { escala, x, y } = camara;
    const visible = calcularLimites(camara, ancho, alto, grosor);
    contexto.strokeStyle = color;
    contexto.lineWidth = grosor;
    contexto.setLineDash(guiones);
    let enLote = 0;
    contexto.beginPath();
    for (const arista of aristas) {
        if (!dentroDeVista(arista, visible)) continue;
        for (const camino of arista.caminos) {
            contexto.moveTo(camino[0] * escala + x, camino[1] * escala + y);
            for (let i = 2; i < camino.length; i += 2) {
                contexto.lineTo(camino[i] * escala + x, camino[i + 1] * escala + y);
            }
        }
        if (++enLote === ARISTAS_POR_LOTE) {
            contexto.stroke();
            contexto.beginPath();
            enLote = 0;
        }
    }
    contexto.stroke();
}

function agruparAristas(aristas) {
    const tramos = [], candidatas = [];
    for (const arista of aristas) {
        (arista.clase === 'tramo_documentado' ? tramos : candidatas).push(arista);
    }
    return { tramos, candidatas };
}

export function caminosSeleccionados(escena, ids) {
    return agruparAristas(ids.map((id) => escena.aristas.get(id)));
}

export function radioPunto(escena, aumento) {
    const base = Math.min(4, Math.max(1.3, 14 / Math.sqrt(escena.ids.length)));
    return Math.min(6, base * Math.sqrt(Math.max(1, aumento)));
}

export function dibujarRed(contexto, escena, camara, ancho, alto, aumento = 1, arbol = null) {
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, ancho, alto);
    contexto.lineJoin = 'round';
    const radio = radioPunto(escena, aumento);
    const detalle = prepararRotulos(escena, camara, ancho, alto, radio);
    const guiones = detalle ? GUIONES_CANDIDATA : [];
    if (arbol) {
        dibujarLineas(contexto, escena.tramos, camara, ancho, alto, COLOR_DESCARTADA, 0.6);
        dibujarLineas(contexto, escena.candidatas, camara, ancho, alto, COLOR_DESCARTADA, 0.6, guiones);
        dibujarLineas(contexto, arbol.tramos, camara, ancho, alto, COLOR_ARBOL, detalle ? 2.5 : 1.5);
        dibujarLineas(contexto, arbol.candidatas, camara, ancho, alto,
            COLOR_ARBOL_CANDIDATA_GENERAL, detalle ? 2.5 : 1.5, guiones);
    } else {
        dibujarLineas(contexto, escena.tramos, camara, ancho, alto, COLOR_TRAMO, detalle ? 2.7 : 1.35);
        dibujarLineas(contexto, escena.candidatas, camara, ancho, alto,
            detalle ? COLOR_CANDIDATA : COLOR_CANDIDATA_GENERAL, detalle ? 1.8 : 0.8, guiones);
    }
    if (detalle) dibujarRotulos(contexto, escena, camara, ancho, alto, radio, arbol, detalle);
    else dibujarNodos(contexto, escena, camara, ancho, alto, radio);
    return detalle?.porIndice;
}

export function dibujarRotulos(contexto, escena, camara, ancho, alto, radio, arbol, detalle) {
    const visibles = arbol ?? escena;
    const indices = detalle.nodos.map((nodo) => nodo.indice);
    dibujarPesos(contexto, [visibles.tramos, visibles.candidatas], detalle.nodos, camara, ancho, alto);
    dibujarNodos(contexto, escena, camara, ancho, alto, radio, detalle.porIndice, indices);
}

function dibujarNodos(contexto, escena, camara, ancho, alto, radio, rotulos, indices = escena.indiceNodos) {
    contexto.fillStyle = rotulos ? '#ffffff' : COLOR_NODO;
    if (rotulos) {
        contexto.strokeStyle = COLOR_NODO;
        contexto.lineWidth = 1.25;
        contexto.setLineDash([]);
    }
    const { escala, x, y } = camara;
    contexto.beginPath();
    for (const indice of indices) {
        const i = indice * 2;
        const radioNodo = rotulos?.get(indice)?.radio ?? radio;
        const px = escena.nodos[i] * escala + x, py = escena.nodos[i + 1] * escala + y;
        if (px < -radioNodo || px > ancho + radioNodo || py < -radioNodo || py > alto + radioNodo) continue;
        contexto.moveTo(px + radioNodo, py);
        contexto.arc(px, py, radioNodo, 0, 2 * Math.PI);
    }
    contexto.fill();
    if (rotulos) {
        contexto.stroke();
        dibujarNombres(contexto, rotulos);
    }
}

export function nodoCercano(escena, camara, punto, distanciaMaxima = 10, rotulos) {
    let mejor = -1;
    let mejorDistancia = Infinity;
    const radio = rotulos?.size ? Math.max(distanciaMaxima, 28) : distanciaMaxima;
    const vista = limitesDelPunto(camara, punto, radio);
    for (const indice of nodosEnVista(escena, vista)) {
        const dx = escena.nodos[indice * 2] * camara.escala + camara.x - punto.x;
        const dy = escena.nodos[indice * 2 + 1] * camara.escala + camara.y - punto.y;
        const distancia = dx * dx + dy * dy;
        const limite = rotulos?.get(indice)?.radio ?? distanciaMaxima;
        if (distancia < limite ** 2 && distancia < mejorDistancia) {
            mejorDistancia = distancia;
            mejor = indice;
        }
    }
    return mejor;
}

function limitesDelPunto(camara, punto, radio) {
    return calcularLimites({ ...camara, x: camara.x - punto.x, y: camara.y - punto.y }, 0, 0, radio);
}

export function nodosCoincidentes(escena, indice) {
    const x = escena.nodos[2 * indice], y = escena.nodos[2 * indice + 1];
    return [...nodosEnVista(escena, { minX: x, maxX: x, minY: y, maxY: y })];
}

export function aristasCercanas(escena, camara, punto, radio = 6) {
    const vista = limitesDelPunto(camara, punto, radio);
    const x = (punto.x - camara.x) / camara.escala, y = (punto.y - camara.y) / camara.escala;
    const umbral = (radio / camara.escala) ** 2;
    const cercanas = [];
    for (const arista of escena.aristas.values()) {
        if (!dentroDeVista(arista, vista)) continue;
        const cerca = arista.caminos.some((camino) => {
            for (let i = 2; i < camino.length; i += 2) {
                const dx = camino[i] - camino[i - 2], dy = camino[i + 1] - camino[i - 1];
                const desdeX = x - camino[i - 2], desdeY = y - camino[i - 1];
                const proyeccion = (desdeX * dx + desdeY * dy) / (dx * dx + dy * dy || 1);
                const avance = Math.max(0, Math.min(1, proyeccion));
                if ((desdeX - dx * avance) ** 2 + (desdeY - dy * avance) ** 2 <= umbral) return true;
            }
            return false;
        });
        if (cerca) cercanas.push(arista);
    }
    return cercanas;
}
