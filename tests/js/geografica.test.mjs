import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cargarGrafoDesdeJson } from '../../frontend/static/js/datos-georreferenciados.js';
import {
    aristasCercanas, caminosSeleccionados, conservarCentro, crearEscena, dibujarRed, elegirMotor,
    encuadrar, nodoCercano, nodosCoincidentes,
} from '../../frontend/static/js/proyeccion-geografica.js';
import { longitudEnMetros, metros } from '../../frontend/static/js/formato-informe.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const pequena = () => leer('../datos/red_pequena.json');

function contextoFalso() {
    const llamadas = { moveTo: 0, lineTo: 0, fillRect: 0, stroke: 0, arc: 0, fill: 0 };
    const guiones = [];
    const textos = [];
    const contexto = {
        llamadas, guiones, textos,
        setLineDash: (valor) => guiones.push(valor),
        measureText: (texto) => ({ width: texto.length * 6 }),
        fillText: (texto) => textos.push(texto),
        strokeText() {},
        beginPath() {},
    };
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
    const camino = pantalla(escena.aristas.get('t-1').caminos[0]);
    assert.ok(camino[2] > x3 && camino[2] <= 400);
    assert.deepEqual(pantalla(escena.aristas.get('c-1').caminos[0]), [x1, y1, x2, y2]);
    assert.equal(nodoCercano(escena, camara, { x: x3 + 2, y: y3 - 2 }), 2);
});

test('dibuja círculos con identificador y líneas con peso en metros', () => {
    const escena = crearEscena(cargarGrafoDesdeJson(pequena()));
    const contexto = contextoFalso();
    const camara = encuadrar(escena, 800, 600);
    const rotulos = dibujarRed(contexto, escena, camara, 800, 600);
    assert.equal(contexto.llamadas.arc, 3);
    assert.equal(contexto.llamadas.moveTo - contexto.llamadas.arc, 4);
    assert.equal(contexto.llamadas.lineTo, 5);
    assert.deepEqual(contexto.guiones.slice(0, 2).map((g) => g.length), [0, 2]);
    for (const texto of ['poste-1', 'poste-2', 'poste-3', '3', '5', '7', '9']) {
        assert.ok(contexto.textos.includes(texto), `Falta el rótulo ${texto}`);
    }
    const nodo = rotulos.get(0);
    assert.equal(nodoCercano(escena, camara, { x: nodo.x + nodo.radio - 1, y: nodo.y }, 10, rotulos), 0);
});

test('conserva círculos del mismo tamaño y divide los identificadores largos', () => {
    const entrada = pequena();
    entrada.nodos.push({ id: 'poste-largo', coordenadas: [-77.049, -12.05] });
    const escena = crearEscena(cargarGrafoDesdeJson(entrada));
    const contexto = contextoFalso();
    const rotulos = dibujarRed(contexto, escena, encuadrar(escena, 800, 600), 800, 600);
    assert.equal(rotulos.size, entrada.nodos.length);
    assert.equal(new Set([...rotulos.values()].map((nodo) => nodo.radio)).size, 1);
    assert.ok(contexto.textos.includes('poste-') && contexto.textos.includes('largo'));
});

test('selecciona geometrías por ID aunque las clases estén intercaladas', () => {
    const escena = crearEscena(cargarGrafoDesdeJson(pequena()));
    const arbol = caminosSeleccionados(escena, ['t-1', 'c-1']);
    assert.equal(arbol.tramos[0], escena.aristas.get('t-1'));
    assert.equal(arbol.tramos[0].caminos[0].length, 6);
    assert.equal(arbol.candidatas[0], escena.aristas.get('c-1'));
    const contexto = contextoFalso();
    dibujarRed(contexto, escena, encuadrar(escena, 400, 300), 400, 300, 1, arbol);
    assert.deepEqual(contexto.guiones.slice(0, 4).map((g) => g.length), [0, 2, 0, 2]);
    assert.ok(!contexto.textos.some((texto) => texto === '7' || texto === '9'));
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
        assert.deepEqual(contexto.textos, []);
    });
}

test('formatea la longitud hasta el milímetro', () => {
    assert.equal(metros(137416341).replace(/\s/g, ' '), '137 416,341 m');
    assert.equal(metros('9007199254740993').replace(/\s/g, ' '), '9 007 199 254 740,993 m');
    assert.equal(longitudEnMetros(Number.MAX_SAFE_INTEGER, true).replace(/\s/g, ' '), '9 007 199 254 740,991');
});

test('mantiene el zoom relativo y el punto geográfico central al cambiar el tamaño', () => {
    const escena = crearEscena(pequena());
    const anterior = encuadrar(escena, 1056, 836, 50);
    const ajuste = encuadrar(escena, 390, 548, 75);
    const camara = { escala: 2 * anterior.escala, x: anterior.x + 80, y: anterior.y - 25 };
    const nueva = conservarCentro(camara, anterior, ajuste, 390, 548);
    assert.equal(nueva.escala / ajuste.escala, 2);
    assert.ok(Math.abs((195 - nueva.x) / nueva.escala - (anterior.x - camara.x) / camara.escala) < 1e-12);
    assert.ok(Math.abs((274 - nueva.y) / nueva.escala - (anterior.y - camara.y) / camara.escala) < 1e-12);
});

test('conserva los extremos y puntos intermedios cerca del antimeridiano', () => {
    const origen = [179.9, 0], destino = [-179.9, 0], intermedio = [180, 0.05];
    const grafo = {
        nodos: [{ id: 'o', coordenadas: origen }, { id: 'e', coordenadas: destino }],
        aristas: [{ id: 't', origen: 'o', destino: 'e', peso_mm: 10, clase: 'tramo_documentado', trazado: [origen, intermedio, destino] }],
    };
    const escena = crearEscena(cargarGrafoDesdeJson(grafo));
    assert.ok(escena.anchoPlano > 0.19 && escena.anchoPlano < 0.21);
    assert.equal(escena.segmentos, 2);
    const [camino] = escena.aristas.get('t').caminos;
    assert.deepEqual([...camino.slice(0, 2), ...camino.slice(-2)], [...escena.nodos]);
    assert.deepEqual(escena.coordenadas, [origen, destino]);
});

test('representa los tramos que cruzan el corte de un grafo de alcance global', () => {
    const nodos = [-150, -60, 40, 130].map((longitud, i) => ({ id: String(i), coordenadas: [longitud, i] }));
    const aristas = [{ id: 't', origen: '1', destino: '2', peso_mm: 10, clase: 'tramo_documentado' }];
    const escena = crearEscena({ nodos, aristas });
    const caminos = escena.aristas.get('t').caminos;
    assert.equal(caminos.length, 2);
    assert.ok(caminos.every((camino) => Math.abs(camino[2] - camino[0]) < 180));
    assert.deepEqual([...caminos[0].slice(0,2), ...caminos[1].slice(-2)], [...escena.nodos.slice(2,6)]);
});

test('recupera todos los nodos y conexiones que comparten una posición', () => {
    const grafo = pequena();
    grafo.nodos.push({ id: 'poste-4', coordenadas: grafo.nodos[0].coordenadas });
    const escena = crearEscena(cargarGrafoDesdeJson(grafo));
    const camara = encuadrar(escena, 800, 600);
    const contexto = contextoFalso();
    dibujarRed(contexto, escena, camara, 800, 600);
    assert.deepEqual(nodosCoincidentes(escena, 0), [0, 3]);
    assert.ok(contexto.textos.includes('2 nodos'));
    const x = (escena.nodos[0] + escena.nodos[2]) / 2 * camara.escala + camara.x;
    const y = escena.nodos[1] * camara.escala + camara.y;
    assert.deepEqual(aristasCercanas(escena, camara, { x, y }).map((arista) => arista.id), ['c-1', 't-2']);
});

test('el motor depende de segmentos y densidad, además de cantidad de nodos', () => {
    const ligera = crearEscena(pequena());
    const ajuste = encuadrar(ligera, 1056, 836, 50);
    assert.equal(elegirMotor(ligera, ajuste, 1056, 836), 'canvas');
    assert.equal(elegirMotor({ ...ligera, segmentos: 41_000 }, ajuste, 1056, 836), 'three');
    assert.equal(elegirMotor({ ...ligera, longitudPlano: 2_000_000 / ajuste.escala }, ajuste, 1056, 836), 'three');
});
