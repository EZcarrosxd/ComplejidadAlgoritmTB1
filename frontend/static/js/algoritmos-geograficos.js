import { $, anunciar, crear, formatoMoneda } from './dom.js';
import { suscribir, toca } from './estado.js';
import { analizarGeorreferenciado, conLimiteDeEspera } from './api.js';
import { explicarError } from './errores.js';
import { mostrarArbol } from './vista-geografica.js';
import { formatoInforme, formatoSegundosInforme, metros } from './formato-informe.js';

const NOMBRES = { kruskal: 'Kruskal', prim: 'Prim', bfs: 'BFS' };
const botones = [...document.querySelectorAll('.metodo-geografico')];
const precio = $('geo-precio');
let grafo = null;
let trabajo = null;

function marcar(algoritmo) {
    botones.forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.algoritmo === algoritmo)));
}

function ocupar(ocupado) {
    botones.forEach((boton) => { boton.disabled = ocupado; });
    precio.disabled = ocupado;
}

function mostrarCifras(filas) {
    const lista = $('geo-resultado');
    lista.replaceChildren(...filas.map(([titulo, valor, anchoCompleto]) => {
        const fila = crear('div', anchoCompleto ? 'cifra-ancha' : '');
        fila.append(crear('dt', '', titulo), crear('dd', '', valor));
        return fila;
    }));
    lista.hidden = !filas.length;
}

function describirArbol(resultado) {
    const tipo = resultado.componentes === 1 ? 'árbol' : 'bosque';
    const filas = [
        ['Longitud mínima', metros(resultado.peso_total_mm), true],
        [`Aristas del ${tipo}`, `${formatoInforme.format(resultado.cantidad)} de ${formatoInforme.format(resultado.aristas)}`],
    ];
    if (resultado.componentes > 1) filas.push(['Componentes', formatoInforme.format(resultado.componentes)]);
    if (resultado.costo_estimado !== undefined) {
        filas.push(['Cableado estimado', `S/ ${formatoMoneda.format(resultado.costo_estimado)}`, true]);
    }
    mostrarCifras(filas);
    $('geo-estado-algoritmo').textContent = `${NOMBRES[resultado.algoritmo]} calculó el ${tipo} en ${formatoSegundosInforme.format(resultado.segundos)} s`;
}

function describirBfs(resultado) {
    mostrarCifras([
        ['Conectividad', resultado.conexo ? 'Conexa' : 'Desconectada', true],
        ['Componentes', formatoInforme.format(resultado.componentes)],
        ['Mayor componente', formatoInforme.format(resultado.mayor_componente)],
    ]);
    $('geo-estado-algoritmo').textContent = `BFS recorrió ${formatoInforme.format(resultado.nodos)} nodos en ${formatoSegundosInforme.format(resultado.segundos)} s`;
}

function volverAlOriginal() {
    trabajo?.abort();
    trabajo = null;
    ocupar(false);
    marcar('original');
    mostrarCifras([]);
    mostrarArbol(null, null);
    $('geo-estado-algoritmo').textContent = 'Elige un algoritmo para ejecutarlo sobre la red cargada';
}

async function ejecutar(algoritmo) {
    if (!grafo || trabajo || (algoritmo !== 'bfs' && !precio.reportValidity())) return;
    const precioPorMetro = algoritmo === 'bfs' ? '' : precio.value;
    const control = new AbortController();
    trabajo = control;
    marcar(algoritmo);
    ocupar(true);
    mostrarCifras([]);
    mostrarArbol(null, null);
    $('geo-estado-algoritmo').textContent = `Ejecutando ${NOMBRES[algoritmo]}`;
    const aviso = setTimeout(() => {
        $('geo-estado-algoritmo').textContent = 'Esperando la respuesta del servidor';
    }, 6000);
    try {
        const resultado = await conLimiteDeEspera(
            (senal) => analizarGeorreferenciado(grafo, algoritmo, precioPorMetro, senal), control);
        if (trabajo !== control) return;
        if (algoritmo === 'bfs') {
            describirBfs(resultado);
        } else {
            mostrarArbol(algoritmo, resultado.aristas_seleccionadas, resultado.componentes);
            describirArbol(resultado);
        }
        anunciar($('geo-estado-algoritmo').textContent);
    } catch (fallo) {
        if (trabajo !== control) return;
        const error = explicarError(fallo);
        $('geo-estado-algoritmo').textContent = `${error.titulo}\n${error.indicacion}`;
        marcar('original');
    } finally {
        clearTimeout(aviso);
        if (trabajo === control) {
            trabajo = null;
            ocupar(false);
        }
    }
}

botones.forEach((boton) => boton.addEventListener('click', () => {
    const algoritmo = boton.dataset.algoritmo;
    if (algoritmo === 'original') volverAlOriginal();
    else ejecutar(algoritmo);
}));

precio.addEventListener('input', () => {
    const activo = botones.find((boton) => boton.getAttribute('aria-pressed') === 'true');
    if (['kruskal', 'prim'].includes(activo?.dataset.algoritmo)) volverAlOriginal();
});

suscribir((estado, cambios) => {
    if (!toca(cambios, 'redGeografica')) return;
    grafo = estado.redGeografica;
    precio.value = '';
    volverAlOriginal();
});
