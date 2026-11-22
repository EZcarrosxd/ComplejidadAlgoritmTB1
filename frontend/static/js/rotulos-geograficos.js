const AREA_POR_NODO = 2800;
const RADIO_MINIMO = 16;
const RADIO_MAXIMO = 28;
const ESPACIO = 4;
const COLOR_TEXTO = '#171717';
const FUENTE_NODO = '600 12px Inter, sans-serif';

export const espacioParaRotulos = (ancho, alto) => Math.max(1, Math.floor(ancho * alto / AREA_POR_NODO));

function cabe(caja, ancho, alto) {
    return caja.x - caja.mitadAncho >= ESPACIO && caja.x + caja.mitadAncho <= ancho - ESPACIO
        && caja.y - caja.mitadAlto >= ESPACIO && caja.y + caja.mitadAlto <= alto - ESPACIO;
}

function seCruzan(a, b) {
    return Math.abs(a.x - b.x) < a.mitadAncho + b.mitadAncho + ESPACIO
        && Math.abs(a.y - b.y) < a.mitadAlto + b.mitadAlto + ESPACIO;
}

function seTocan(a, b) {
    const distancia = a.mitadAncho + b.mitadAncho + ESPACIO;
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < distancia ** 2;
}

function calcularRadio(nodos) {
    let menor = (2 * RADIO_MAXIMO + ESPACIO) ** 2;
    const minimo = (2 * RADIO_MINIMO + ESPACIO) ** 2;
    for (let i = 0; i < nodos.length; i++) {
        for (let j = 0; j < i; j++) {
            const distancia = (nodos[i].x - nodos[j].x) ** 2 + (nodos[i].y - nodos[j].y) ** 2;
            if (distancia >= minimo && distancia < menor) menor = distancia;
        }
    }
    return Math.floor((Math.sqrt(menor) - ESPACIO) / 2);
}

export function prepararRotulos(escena, camara, ancho, alto, radioBase) {
    const limite = espacioParaRotulos(ancho, alto);
    const nodos = [];
    const vista = calcularLimites(camara, ancho, alto, radioBase);
    for (const indice of nodosEnVista(escena, vista)) {
        const mundoX = escena.nodos[2 * indice], mundoY = escena.nodos[2 * indice + 1];
        const anterior = nodos.at(-1);
        if (anterior?.mundoX === mundoX && anterior.mundoY === mundoY) {
            anterior.cantidad++;
            continue;
        }
        if (nodos.length === limite) return null;
        const x = mundoX * camara.escala + camara.x, y = mundoY * camara.escala + camara.y;
        nodos.push({ indice, mundoX, mundoY, x, y, mitadAncho: radioBase, mitadAlto: radioBase, cantidad: 1 });
    }

    const porIndice = new Map();
    const radio = calcularRadio(nodos);
    for (const nodo of nodos) {
        const caja = { ...nodo, mitadAncho: radio, mitadAlto: radio };
        if (!cabe(caja, ancho, alto) || nodos.some((otro) => otro !== nodo && seTocan(caja, otro))) continue;
        nodo.mitadAncho = radio;
        nodo.mitadAlto = radio;
        const texto = nodo.cantidad === 1 ? escena.ids[nodo.indice] : `${nodo.cantidad} nodos`;
        porIndice.set(nodo.indice, { ...caja, radio, texto });
    }
    return { nodos, porIndice };
}

function proyectarLineas(grupos, camara, ancho, alto, limite) {
    const segmentos = [], pesos = [];
    const vista = calcularLimites(camara, ancho, alto);
    let revisados = 0;
    for (const grupo of grupos) {
        for (const arista of grupo) {
            if (!dentroDeVista(arista, vista)) continue;
            let principal = null;
            let mayorLongitud = 0;
            for (const camino of arista.caminos) {
                for (let i = 0; i + 3 < camino.length; i += 2) {
                    if (++revisados > limite * 32 || segmentos.length >= limite * 6) return null;
                    const x = camino[i] * camara.escala + camara.x;
                    const y = camino[i + 1] * camara.escala + camara.y;
                    const finX = camino[i + 2] * camara.escala + camara.x;
                    const finY = camino[i + 3] * camara.escala + camara.y;
                    if (Math.max(x, finX) < 0 || Math.min(x, finX) > ancho ||
                        Math.max(y, finY) < 0 || Math.min(y, finY) > alto) continue;
                    const dx = finX - x, dy = finY - y;
                    const longitud = Math.hypot(dx, dy);
                    const segmento = { x, y, finX, finY, dx, dy, longitud };
                    segmentos.push(segmento);
                    if (longitud > mayorLongitud) {
                        mayorLongitud = longitud;
                        principal = segmento;
                    }
                }
            }
            if (mayorLongitud >= 20 && pesos.length < limite) pesos.push({ peso: arista.peso, ...principal });
        }
    }
    return { segmentos, pesos };
}

function cruzaLinea(caja, linea) {
    const { x, y, finX, finY, dx, dy } = linea;
    const { mitadAncho, mitadAlto } = caja;
    if (Math.max(x, finX) < caja.x - mitadAncho || Math.min(x, finX) > caja.x + mitadAncho ||
        Math.max(y, finY) < caja.y - mitadAlto || Math.min(y, finY) > caja.y + mitadAlto) return false;
    const distancia = Math.abs(dy * (caja.x - x) - dx * (caja.y - y));
    return distancia <= Math.abs(dy) * mitadAncho + Math.abs(dx) * mitadAlto;
}

function ubicarPeso(linea, mitadAncho, cajas, segmentos, ancho, alto) {
    const { x, y, dx, dy, longitud } = linea;
    const normalX = -dy / longitud, normalY = dx / longitud;
    const mitadAlto = 8;
    const base = 3 + Math.abs(normalX) * mitadAncho + Math.abs(normalY) * mitadAlto;
    for (const margen of [0, 9, 18, 28]) {
        for (const avance of [0.5, 0.38, 0.62, 0.25, 0.75]) {
            for (const lado of [-1, 1]) {
                const distancia = (base + margen) * lado;
                const etiqueta = {
                    x: x + dx * avance + normalX * distancia,
                    y: y + dy * avance + normalY * distancia,
                    mitadAncho,
                    mitadAlto,
                };
                if (cabe(etiqueta, ancho, alto) && !cajas.some((caja) => seCruzan(etiqueta, caja))
                    && !segmentos.some((segmento) => cruzaLinea(etiqueta, segmento))) return etiqueta;
            }
        }
    }
    return null;
}

export function dibujarPesos(contexto, grupos, rectangulos, camara, ancho, alto) {
    const limite = espacioParaRotulos(ancho, alto);
    const lineas = proyectarLineas(grupos, camara, ancho, alto, limite);
    if (!lineas) return;
    const { segmentos, pesos } = lineas;
    contexto.font = '500 13px Inter, sans-serif';
    contexto.textAlign = 'center';
    contexto.textBaseline = 'middle';
    contexto.strokeStyle = '#ffffff';
    contexto.lineWidth = 4;
    contexto.fillStyle = COLOR_TEXTO;
    contexto.setLineDash([]);
    for (const linea of pesos) {
        const texto = longitudEnMetros(linea.peso, true);
        const mitadAncho = contexto.measureText(texto).width / 2 + 2;
        const etiqueta = ubicarPeso(linea, mitadAncho, rectangulos, segmentos, ancho, alto);
        if (!etiqueta) continue;
        contexto.strokeText(texto, etiqueta.x, etiqueta.y);
        contexto.fillText(texto, etiqueta.x, etiqueta.y);
        rectangulos.push(etiqueta);
    }
}

export function dibujarNombres(contexto, rotulos) {
    contexto.font = FUENTE_NODO;
    contexto.textAlign = 'center';
    contexto.textBaseline = 'middle';
    contexto.fillStyle = COLOR_TEXTO;
    for (const { texto, x, y, radio } of rotulos.values()) {
        const ancho = 2 * (radio - 5);
        if (contexto.measureText(texto).width <= ancho || texto.length < 3) {
            contexto.fillText(texto, x, y, ancho);
            continue;
        }
        const separador = texto.search(/[-_:]/);
        const corte = separador > 0 && separador < texto.length - 1 ? separador + 1 : Math.ceil(texto.length / 2);
        contexto.fillText(texto.slice(0, corte), x, y - 6, ancho);
        contexto.fillText(texto.slice(corte), x, y + 6, ancho);
    }
}
import { calcularLimites, dentroDeVista, nodosEnVista } from './espacio-geografico.js';
import { longitudEnMetros } from './formato-informe.js';
