import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cargarGrafoDesdeJson } from '../../frontend/static/js/datos-georreferenciados.js';
import { caminosSeleccionados, crearEscena, dibujarRed, encuadrar, nodoCercano } from '../../frontend/static/js/proyeccion-geografica.js';
import { metros } from '../../frontend/static/js/formato-informe.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const pequena = () => leer('../datos/red_pequena.json');

function contextoFalso() {
    const llamadas = { moveTo: 0, lineTo: 0, fillRect: 0, stroke: 0, arc: 0, fill: 0 };
    const guiones = [];
    const contexto = { llamadas, guiones, setLineDash: (valor) => guiones.push(valor), beginPath() {} };
    for (const nombre of Object.keys(llamadas)) contexto[nombre] = () => { llamadas[nombre]++; };
    return contexto;
}

test('acepta la red con nodos y aristas en cualquier orden', () => {
    const entrada = pequena();
    const grafo = cargarGrafoDesdeJson({ aristas: entrada.aristas, nodos: entrada.nodos });
    assert.deepEqual(grafo, entrada);
    assert.equal(grafo.aristas[1].trazado.length, 3);
});

test('rechaza campos ajenos al formato', () => {
    assert.throws(() => cargarGrafoDesdeJson({ ...pequena(), procedencia: {} }), /listas?|lista de nodos/);
    const entrada = pequena();
    entrada.aristas[0].capacidad = 20;
    assert.throws(() => cargarGrafoDesdeJson(entrada), /campos/);
});

test('rechaza aristas inválidas y trazados incompletos', () => {
    for (const [cambio, mensaje] of [
        [{ peso_mm: 1.5 }, /milímetros/],
        [{ peso_mm: 2 ** 53 }, /milímetros/],
        [{ clase: 'otro' }, /clase/],
        [{ origen: 'inexistente' }, /extremos/],
        [{ id: 't-1' }, /repetido/],
        [{ trazado: null }, /punto intermedio/],
        [{ trazado: [[-77.05, -12.05], [-77.04, -12.05]] }, /punto intermedio/],
        [{ trazado: [[-77.04, -12.05], [-77.045, -12.04], [-77.05, -12.05]] }, /comenzar/],
    ]) {
        const entrada = pequena();
        Object.assign(entrada.aristas[0], cambio);
        assert.throws(() => cargarGrafoDesdeJson(entrada), mensaje);
    }
});

test('rechaza nodos repetidos y coordenadas inválidas', () => {
    const entrada = pequena();
    entrada.nodos[1].id = entrada.nodos[0].id;
    assert.throws(() => cargarGrafoDesdeJson(entrada), /repetido/);
    entrada.nodos[0].coordenadas[1] = -91;
    assert.throws(() => cargarGrafoDesdeJson(entrada), /WGS 84/);
});

test('el encuadre incluye los puntos intermedios y conserva la orientación', () => {
    const entrada = pequena();
    entrada.aristas[1].clase = 'candidata_geografica';
    const escena = crearEscena(cargarGrafoDesdeJson(entrada));
    const camara = encuadrar(escena, 400, 300);
    const pantalla = (puntos) => [...puntos].map((v, i) => v * camara.escala + (i % 2 ? camara.y : camara.x));
    const [x1, y1, x2, y2, x3, y3] = pantalla(escena.nodos);
    assert.ok(x2 > x1 && y3 < y2);
    assert.equal(y1, y2);
    const camino = pantalla(escena.aristas.get('t-1').camino);
    assert.ok(camino[2] > x3 && camino[2] <= 400);
    assert.deepEqual(pantalla(escena.aristas.get('c-1').camino), [x1, y1, x2, y2]);
    assert.equal(nodoCercano(escena, camara, { x: x3 + 2, y: y3 - 2 }), 2);
});

test('dibuja círculos, líneas rectas y trazados diferenciados por clase', () => {
    const escena = crearEscena(cargarGrafoDesdeJson(pequena()));
    const contexto = contextoFalso();
    dibujarRed(contexto, escena, encuadrar(escena, 400, 300), 400, 300);
    assert.equal(contexto.llamadas.arc, 3);
    assert.equal(contexto.llamadas.moveTo - contexto.llamadas.arc, 4);
    assert.equal(contexto.llamadas.lineTo, 5);
    assert.deepEqual(contexto.guiones.map((g) => g.length), [2, 0]);
});

test('selecciona geometrías por ID aunque las clases estén intercaladas', () => {
    const escena = crearEscena(cargarGrafoDesdeJson(pequena()));
    const arbol = caminosSeleccionados(escena, ['t-1', 'c-1']);
    assert.equal(arbol.tramos[0], escena.aristas.get('t-1').camino);
    assert.equal(arbol.tramos[0].length, 6);
    assert.equal(arbol.candidatas[0], escena.aristas.get('c-1').camino);
    const contexto = contextoFalso();
    dibujarRed(contexto, escena, encuadrar(escena, 400, 300), 400, 300, 1, arbol);
    assert.deepEqual(contexto.guiones.map((g) => g.length), [2, 0, 2, 0]);
});

test('encuadra redes desconectadas y redes de un solo nodo', () => {
    for (const entrada of [leer('../datos/red_separada.json'), { nodos: [{ id: 'p', coordenadas: [0, 0] }], aristas: [] }]) {
        const escena = crearEscena(cargarGrafoDesdeJson(entrada));
        const camara = encuadrar(escena, 400, 300);
        assert.ok(Number.isFinite(camara.escala) && camara.escala > 0);
        const contexto = contextoFalso();
        dibujarRed(contexto, escena, camara, 400, 300);
        assert.equal(contexto.llamadas.arc, entrada.nodos.length);
    }
});

for (const nombre of ['red_osinergmin.json', 'red_osinergmin_ampliada.json']) {
    test(`dibuja toda la red de ${nombre}`, () => {
        const grafo = cargarGrafoDesdeJson(leer(`../../dataset/${nombre}`));
        const escena = crearEscena(grafo);
        const contexto = contextoFalso();
        dibujarRed(contexto, escena, encuadrar(escena, 1072, 932), 1072, 932);
        assert.equal(contexto.llamadas.arc, grafo.nodos.length);
        assert.equal(contexto.llamadas.moveTo - contexto.llamadas.arc, grafo.aristas.length);
        assert.equal(contexto.llamadas.lineTo, grafo.aristas.reduce((n, a) => n + (a.trazado?.length ?? 2) - 1, 0));
    });
}

test('formatea la longitud hasta el milímetro', () => {
    assert.equal(metros(137416341).replace(/\s/g, ' '), '137 416,341 m');
    assert.equal(metros('9007199254740993').replace(/\s/g, ' '), '9 007 199 254 740,993 m');
});
