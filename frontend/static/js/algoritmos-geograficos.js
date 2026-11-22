import { $, anunciar, crear } from './dom.js';
import { suscribir, toca } from './estado.js';
import { analizarGeorreferenciado, conLimiteDeEspera, ErrorServidor } from './api.js';
import { explicarError } from './errores.js';
import { ALTERNATIVAS, crearGrafoCompacto } from './datos-georreferenciados.js';
import { mostrarArbol } from './vista-geografica.js';
import { formatoInforme, formatoSegundosInforme, metros } from './formato-informe.js';

const NOMBRES = { kruskal: 'Kruskal', prim: 'Prim', bfs: 'BFS' };
const AVISO_INICIO = 'El servidor puede estar iniciándose\nLa primera respuesta puede tardar hasta un minuto';

const botones = [...document.querySelectorAll('.metodo-geografico')];
const comparacion = { A: {}, B: {} };
let grafo = null;
let trabajo = null;

function marcar(algoritmo) {
    botones.forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.algoritmo === algoritmo)));
}

function ocupar(ocupado) {
    botones.forEach((boton) => { boton.disabled = ocupado; });
}

function mostrarCifras(filas) {
    const lista = $('geo-resultado');
    lista.replaceChildren(...filas.map(([titulo, valor]) => {
        const fila = crear('div');
        fila.append(crear('dt', '', titulo), crear('dd', '', valor));
        return fila;
    }));
    lista.hidden = !filas.length;
}

function describirArbol(resultado) {
    const nombre = NOMBRES[resultado.algoritmo];
    mostrarCifras([
        ['Longitud mínima', metros(resultado.peso_total_mm)],
        ['Aristas del árbol', `${formatoInforme.format(resultado.cantidad)} de ${formatoInforme.format(resultado.aristas)}`],
    ]);
    const inicio = resultado.nodo_inicial ? `\nPrim empezó en ${resultado.nodo_inicial}` : '';
    $('geo-estado-algoritmo').textContent = `${nombre} se ejecutó en el servidor en ${formatoSegundosInforme.format(resultado.segundos)} s${inicio}`
        + '\nLa longitud es geométrica, no un costo ni un análisis eléctrico';
}

function describirBfs(resultado) {
    mostrarCifras([
        ['Conectividad', resultado.conexo ? 'Conexo' : 'No conexo'],
        ['Componentes', formatoInforme.format(resultado.componentes)],
        ['Mayor componente', `${formatoInforme.format(resultado.mayor_componente)} estructuras`],
    ]);
    $('geo-estado-algoritmo').textContent = `BFS recorrió las ${formatoInforme.format(resultado.nodos)} estructuras en ${formatoSegundosInforme.format(resultado.segundos)} s`
        + `\n${resultado.conexo ? 'Existe un árbol que une todas las estructuras' : 'No existe un único árbol que una todas las estructuras'}`;
}

function celda(valor) {
    return valor === undefined ? '—' : valor;
}

function actualizarComparacion() {
    const { A, B } = comparacion;
    const hayDos = Object.keys(A).length && Object.keys(B).length;
    $('geo-comparacion').hidden = !hayDos;
    if (!hayDos) return;
    const filas = [
        ['Aristas disponibles', (d) => d.aristas !== undefined && formatoInforme.format(d.aristas)],
        ['Aristas del MST', (d) => (d.kruskal ?? d.prim) && formatoInforme.format((d.kruskal ?? d.prim).cantidad)],
        ['Longitud con Kruskal', (d) => d.kruskal && metros(d.kruskal.peso_total_mm)],
        ['Longitud con Prim', (d) => d.prim && metros(d.prim.peso_total_mm)],
        ['Componentes con BFS', (d) => d.bfs && formatoInforme.format(d.bfs.componentes)],
    ];
    $('geo-tabla-comparacion').replaceChildren(...filas.map(([titulo, leer]) => {
        const fila = crear('tr');
        fila.append(crear('th', '', titulo), crear('td', '', celda(leer(A) || undefined)), crear('td', '', celda(leer(B) || undefined)));
        fila.firstChild.scope = 'row';
        return fila;
    }));
    const arbolA = A.kruskal ?? A.prim, arbolB = B.kruskal ?? B.prim;
    $('geo-diferencia').textContent = arbolA && arbolB
        ? `Diferencia A − B: ${metros(arbolA.peso_total_mm - arbolB.peso_total_mm)}\nLos resultados se guardan mientras la página siga abierta`
        : 'Ejecuta Kruskal o Prim en ambas alternativas para ver la diferencia';
}

function guardarEnComparacion(resultado) {
    const letra = ALTERNATIVAS[grafo.alternativa];
    comparacion[letra].aristas = resultado.aristas;
    comparacion[letra][resultado.algoritmo] = resultado;
    actualizarComparacion();
}

function volverAlOriginal() {
    if (trabajo) trabajo.abort();
    trabajo = null;
    ocupar(false);
    marcar('original');
    mostrarCifras([]);
    mostrarArbol('original', null);
    $('geo-estado-algoritmo').textContent = 'Elige un algoritmo para ejecutarlo sobre la red cargada';
}

async function ejecutar(algoritmo) {
    if (!grafo) return;
    const control = new AbortController();
    trabajo = control;
    marcar(algoritmo);
    ocupar(true);
    mostrarCifras([]);
    $('geo-estado-algoritmo').textContent = `Ejecutando ${NOMBRES[algoritmo]} sobre ${formatoInforme.format(grafo.conexiones.length)} aristas`;
    const aviso = setTimeout(() => { $('geo-estado-algoritmo').textContent = AVISO_INICIO; }, 6000);
    try {
        const resultado = await conLimiteDeEspera(
            (senal) => analizarGeorreferenciado(crearGrafoCompacto(grafo, algoritmo), senal), control);
        if (trabajo !== control) return;
        if (algoritmo === 'bfs') {
            mostrarArbol('original', null);
            describirBfs(resultado);
        } else {
            mostrarArbol(algoritmo, resultado.aristas_seleccionadas);
            describirArbol(resultado);
        }
        guardarEnComparacion(resultado);
        anunciar($('geo-estado-algoritmo').textContent);
    } catch (fallo) {
        if (trabajo !== control) return;
        const error = fallo instanceof ErrorServidor && fallo.estadoHttp < 500
            ? { titulo: fallo.message, indicacion: 'Vuelve a cargar el JSON de la alternativa sin modificarlo' }
            : explicarError(fallo);
        $('geo-estado-algoritmo').textContent = `${error.titulo}\n${error.indicacion}`;
        marcar('original');
        mostrarArbol('original', null);
    } finally {
        clearTimeout(aviso);
        if (trabajo === control) {
            trabajo = null;
            ocupar(false);
        }
    }
}

botones.forEach((boton) => boton.addEventListener('click', () => {
    if (boton.dataset.algoritmo === 'original') volverAlOriginal();
    else ejecutar(boton.dataset.algoritmo);
}));

suscribir((s, cambios) => {
    if (!toca(cambios, 'redGeografica')) return;
    grafo = s.redGeografica;
    if (grafo) volverAlOriginal();
    actualizarComparacion();
});
