import { $, anunciar, crear } from './dom.js';
import { actualizar, suscribir, toca } from './estado.js';
import { caminosSeleccionados, crearEscena, dibujarRed, encuadrar, metrosPorGrado, nodoCercano } from './proyeccion-geografica.js';
import { formatoInforme } from './formato-informe.js';

const ANCHO_IMAGEN = 1072;
const ALTO_IMAGEN = 932;
const DENSIDAD_IMAGEN = 2;
const AUMENTO_MINIMO = 0.5;
const AUMENTO_MAXIMO = 400;

const lienzo = $('grafo-geo');
const contexto = lienzo.getContext('2d');
const tip = $('geo-tip');
const vista = {
    escena: null, camara: null, ajuste: null, movida: false, cuadro: 0, bajoPuntero: -1,
    arbol: null, modo: null, componentes: 0,
};

const ancho = () => lienzo.clientWidth;
const alto = () => lienzo.clientHeight;
const aumento = () => (vista.ajuste ? vista.camara.escala / vista.ajuste.escala : 1);

function actualizarEscala() {
    const pixelesPorMetro = vista.camara.escala / metrosPorGrado;
    const unidad = 10 ** Math.floor(Math.log10(60 / pixelesPorMetro));
    const metros = unidad * ([1, 2, 5].find((factor) => factor * unidad * pixelesPorMetro >= 60) ?? 10);
    const [valor, sufijo] = metros >= 1000 ? [metros / 1000, 'km'] : metros < 1 ? [metros * 100, 'cm'] : [metros, 'm'];
    $('geo-escala-barra').style.width = `${Math.round(metros * pixelesPorMetro)}px`;
    $('geo-escala-texto').textContent = `${Number(valor.toPrecision(2))} ${sufijo}`;
}

function dibujar() {
    vista.cuadro = 0;
    const w = ancho(), h = alto();
    if (!vista.escena || !w || !h) return;
    const densidad = window.devicePixelRatio || 1;
    contexto.setTransform(densidad, 0, 0, densidad, 0, 0);
    dibujarRed(contexto, vista.escena, vista.camara, w, h, aumento(), vista.arbol);
    const indice = vista.bajoPuntero;
    if (indice >= 0) {
        const px = vista.escena.nodos[2 * indice] * vista.camara.escala + vista.camara.x;
        const py = vista.escena.nodos[2 * indice + 1] * vista.camara.escala + vista.camara.y;
        contexto.strokeStyle = '#1F1E1B';
        contexto.lineWidth = 2;
        contexto.setLineDash([]);
        contexto.beginPath();
        contexto.arc(px, py, 6, 0, 2 * Math.PI);
        contexto.stroke();
    }
    actualizarEscala();
}

function pedirDibujo() {
    if (!vista.cuadro) vista.cuadro = requestAnimationFrame(dibujar);
}

function redimensionar() {
    if (!vista.escena) return;
    const w = ancho(), h = alto();
    if (!w || !h) return;
    const densidad = window.devicePixelRatio || 1;
    lienzo.width = Math.round(w * densidad);
    lienzo.height = Math.round(h * densidad);
    const nuevoAjuste = encuadrar(vista.escena, w, h, 50);
    if (!vista.movida || !vista.camara) {
        vista.camara = { ...nuevoAjuste };
    }
    vista.ajuste = nuevoAjuste;
    pedirDibujo();
}

export function ajustarGeografica() {
    vista.movida = false;
    redimensionar();
}

function zoomEn(punto, factor) {
    if (!vista.camara) return;
    const minima = vista.ajuste.escala * AUMENTO_MINIMO, maxima = vista.ajuste.escala * AUMENTO_MAXIMO;
    const nuevaEscala = Math.max(minima, Math.min(maxima, vista.camara.escala * factor));
    const proporcion = nuevaEscala / vista.camara.escala;
    vista.camara.x = punto.x - (punto.x - vista.camara.x) * proporcion;
    vista.camara.y = punto.y - (punto.y - vista.camara.y) * proporcion;
    vista.camara.escala = nuevaEscala;
    vista.movida = true;
    pedirDibujo();
}

export const acercarGeografica = () => zoomEn({ x: ancho() / 2, y: alto() / 2 }, 1.5);
export const alejarGeografica = () => zoomEn({ x: ancho() / 2, y: alto() / 2 }, 1 / 1.5);

function ubicar(evento) {
    const rectangulo = lienzo.getBoundingClientRect();
    return { x: evento.clientX - rectangulo.left, y: evento.clientY - rectangulo.top };
}

function mostrarTip(indice, punto) {
    if (vista.bajoPuntero !== indice) {
        vista.bajoPuntero = indice;
        pedirDibujo();
    }
    if (indice < 0) { tip.hidden = true; return; }
    const [longitud, latitud] = vista.escena.coordenadas[indice];
    tip.replaceChildren(
        crear('div', 'tip-id', vista.escena.ids[indice]),
        crear('div', '', `Longitud ${longitud.toFixed(6)}`),
        crear('div', '', `Latitud ${latitud.toFixed(6)}`),
    );
    const x = Math.max(8, Math.min(punto.x + 16, ancho() - 190)), y = Math.max(punto.y - 80, 8);
    tip.style.transform = `translate(${x}px, ${y}px)`;
    tip.hidden = false;
}

let arrastre = null;

lienzo.addEventListener('pointerdown', (evento) => {
    if (!vista.camara) return;
    arrastre = { ...ubicar(evento), camaraX: vista.camara.x, camaraY: vista.camara.y };
    lienzo.setPointerCapture(evento.pointerId);
    lienzo.style.cursor = 'grabbing';
});

lienzo.addEventListener('pointermove', (evento) => {
    if (!vista.escena) return;
    const punto = ubicar(evento);
    if (arrastre) {
        vista.camara.x = arrastre.camaraX + punto.x - arrastre.x;
        vista.camara.y = arrastre.camaraY + punto.y - arrastre.y;
        vista.movida = true;
        mostrarTip(-1);
        pedirDibujo();
        return;
    }
    mostrarTip(nodoCercano(vista.escena, vista.camara, punto), punto);
});

function soltar() {
    arrastre = null;
    lienzo.style.cursor = 'grab';
}

lienzo.addEventListener('pointerup', soltar);
lienzo.addEventListener('pointercancel', soltar);
lienzo.addEventListener('pointerleave', () => mostrarTip(-1));

lienzo.addEventListener('wheel', (evento) => {
    evento.preventDefault();
    mostrarTip(-1);
    zoomEn(ubicar(evento), Math.exp(-evento.deltaY * 0.0015));
}, { passive: false });

function nombreImagen() {
    return vista.modo ? `red_${vista.modo}.png` : 'red.png';
}

function mostrarConteo() {
    const total = formatoInforme.format(vista.escena.aristas.size);
    const tipo = vista.componentes === 1 ? 'Árbol' : 'Bosque';
    const metodo = vista.modo === 'kruskal' ? 'Kruskal' : 'Prim';
    $('geo-conteo').textContent = vista.arbol
        ? `${tipo} de ${metodo} · ${formatoInforme.format(vista.arbol.tramos.length + vista.arbol.candidatas.length)} de ${total} aristas`
        : `${formatoInforme.format(vista.escena.ids.length)} nodos · ${total} aristas`;
}

export function mostrarArbol(modo, ids, componentes) {
    if (!vista.escena) return;
    vista.modo = modo;
    vista.componentes = componentes;
    vista.arbol = ids ? caminosSeleccionados(vista.escena, ids) : null;
    $('geo-leyenda-red').hidden = Boolean(vista.arbol);
    $('geo-leyenda-arbol').hidden = !vista.arbol;
    mostrarConteo();
    pedirDibujo();
}

function guardarImagen() {
    if (!vista.escena) return;
    const imagen = document.createElement('canvas');
    imagen.width = ANCHO_IMAGEN * DENSIDAD_IMAGEN;
    imagen.height = ALTO_IMAGEN * DENSIDAD_IMAGEN;
    const contextoImagen = imagen.getContext('2d');
    contextoImagen.setTransform(DENSIDAD_IMAGEN, 0, 0, DENSIDAD_IMAGEN, 0, 0);
    const camara = encuadrar(vista.escena, ANCHO_IMAGEN, ALTO_IMAGEN);
    dibujarRed(contextoImagen, vista.escena, camara, ANCHO_IMAGEN, ALTO_IMAGEN, 1, vista.arbol);
    imagen.toBlob((archivo) => {
        if (!archivo) return;
        const url = URL.createObjectURL(archivo);
        const descarga = document.createElement('a');
        descarga.href = url;
        descarga.download = nombreImagen();
        descarga.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
}

export function mostrarRedGeografica(grafo, nombre) {
    soltar();
    vista.escena = crearEscena(grafo);
    vista.movida = false;
    vista.camara = null;
    vista.bajoPuntero = -1;
    vista.arbol = null;
    vista.modo = null;
    const { tramos, candidatas } = vista.escena;
    const nodos = grafo.nodos.length;
    const formato = (n) => formatoInforme.format(n);
    $('geo-archivo').textContent = nombre;
    $('geo-nodos').textContent = formato(nodos);
    $('geo-tramos').textContent = formato(tramos.length);
    $('geo-candidatas').textContent = formato(candidatas.length);
    $('geo-aristas').textContent = formato(grafo.aristas.length);
    $('geo-leyenda-red').hidden = false;
    $('geo-leyenda-arbol').hidden = true;
    mostrarConteo();
    actualizar({ fase: 'geografica', error: null, redGeografica: grafo });
    anunciar(`Red cargada\n${formato(nodos)} nodos y ${formato(grafo.aristas.length)} aristas`);
}

suscribir((s, cambios) => {
    if (toca(cambios, 'fase') && s.fase !== 'geografica') {
        vista.escena = null;
        tip.hidden = true;
    }
    if (toca(cambios, 'fase') && s.fase === 'geografica') redimensionar();
});

new ResizeObserver(redimensionar).observe(lienzo);
$('geo-acercar').addEventListener('click', acercarGeografica);
$('geo-alejar').addEventListener('click', alejarGeografica);
$('geo-ajustar').addEventListener('click', ajustarGeografica);
$('geo-guardar').addEventListener('click', guardarImagen);
