import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cargarGrafoDesdeJson, esJsonGeografico } from '../../frontend/static/js/datos-georreferenciados.js';
import { crearEscena, dibujarRed, encuadrar, nodoCercano } from '../../frontend/static/js/proyeccion-geografica.js';

function punto(id, coordenadas) {
    return { type: 'Feature', id, geometry: { type: 'Point', coordinates: coordenadas }, properties: { tipo_nodo: 'estructura_bt' } };
}

function arista(id, clase, origen, destino, camino, alternativas) {
    const properties = { clase, origen, destino };
    if (alternativas) properties.alternativas = alternativas;
    return { type: 'Feature', id, geometry: { type: 'LineString', coordinates: camino }, properties };
}

const coleccion = (features) => ({ type: 'FeatureCollection', features });

function paqueteDePrueba() {
    return {
        tipo: 'grafo_georreferenciado', version: 1, alternativa: 'A_k4', sistema_coordenadas: 'EPSG:4326',
        nodos: coleccion([
            punto('N1', [-77.05, -12.05]), punto('N2', [-77.04, -12.05]), punto('N3', [-77.04, -12.04]),
        ]),
        tramos_documentados: coleccion([
            arista('T1', 'tramo_documentado', 'N1', 'N2', [[-77.05, -12.05], [-77.045, -12.051], [-77.04, -12.05]]),
        ]),
        conexiones_candidatas: coleccion([
            arista('C1', 'candidata_geografica', 'N2', 'N3', [[-77.04, -12.05], [-77.04, -12.04]], ['A_k4']),
        ]),
    };
}

function contextoFalso() {
    const llamadas = { moveTo: 0, lineTo: 0, fillRect: 0, stroke: 0 };
    const contexto = { llamadas, setLineDash() {}, beginPath() {} };
    for (const nombre of Object.keys(llamadas)) contexto[nombre] = () => { llamadas[nombre]++; };
    return contexto;
}

test('carga el paquete y conserva las coordenadas originales', () => {
    const paquete = paqueteDePrueba();
    const grafo = cargarGrafoDesdeJson(paquete);
    assert.deepEqual(grafo.ids, ['N1', 'N2', 'N3']);
    assert.deepEqual(grafo.nodos, paquete.nodos.features.map((n) => n.geometry.coordinates));
    assert.equal(grafo.tramos.length, 1);
    assert.equal(grafo.candidatas.length, 1);
    assert.equal(grafo.tramos[0], paquete.tramos_documentados.features[0].geometry.coordinates);
});

test('rechaza un escenario distinto', () => {
    const paquete = { ...paqueteDePrueba(), alternativa: 'B_k6' };
    assert.throws(() => cargarGrafoDesdeJson(paquete), /escenario A/);
});

test('rechaza una candidata ajena al escenario A', () => {
    const paquete = paqueteDePrueba();
    paquete.conexiones_candidatas.features[0].properties.alternativas = ['B_k6'];
    assert.throws(() => cargarGrafoDesdeJson(paquete), /ajenas al escenario A/);
});

test('rechaza una arista con un extremo inexistente', () => {
    const paquete = paqueteDePrueba();
    paquete.conexiones_candidatas.features[0].properties.destino = 'N9';
    assert.throws(() => cargarGrafoDesdeJson(paquete), /extremos/);
});

test('rechaza una geometría que no termina en su nodo', () => {
    const paquete = paqueteDePrueba();
    paquete.tramos_documentados.features[0].geometry.coordinates[2] = [-77.03, -12.05];
    assert.throws(() => cargarGrafoDesdeJson(paquete), /no coinciden/);
});

test('reconoce el JSON georreferenciado por su cabecera', async () => {
    const archivo = (nombre, texto) => ({ name: nombre, slice: () => ({ text: async () => texto }) });
    assert.equal(await esJsonGeografico(archivo('a.json', JSON.stringify(paqueteDePrueba()))), true);
    assert.equal(await esJsonGeografico(archivo('a.json', '{"conexiones":[]}')), false);
    assert.equal(await esJsonGeografico(archivo('a.csv', '"tipo":"grafo_georreferenciado"')), false);
});

test('la proyección orienta el norte arriba y encuadra los nodos', () => {
    const grafo = cargarGrafoDesdeJson(paqueteDePrueba());
    const escena = crearEscena(grafo);
    const camara = encuadrar(escena, 400, 300);
    const [x1, y1, x2, y2, x3, y3] = [...escena.nodos].map((v, i) => v * camara.escala + (i % 2 ? camara.y : camara.x));
    assert.ok(x2 > x1, 'el este queda a la derecha');
    assert.ok(y3 < y2, 'el norte queda arriba');
    assert.equal(y1, y2);
    for (const valor of [x1, x2, x3]) assert.ok(valor >= 0 && valor <= 400);
    for (const valor of [y1, y2, y3]) assert.ok(valor >= 0 && valor <= 300);
    assert.equal(nodoCercano(escena, camara, { x: x3 + 2, y: y3 - 2 }), 2);
});

test('el encuadre dibuja todas las aristas y estructuras', () => {
    const escena = crearEscena(cargarGrafoDesdeJson(paqueteDePrueba()));
    const contexto = contextoFalso();
    dibujarRed(contexto, escena, encuadrar(escena, 400, 300), 400, 300);
    assert.equal(contexto.llamadas.moveTo, 2);
    assert.equal(contexto.llamadas.lineTo, 3);
    assert.equal(contexto.llamadas.fillRect, 1 + 3);
});

const rutaDataset = process.env.DATASET_OSINERGMIN_A;

test('el dataset del escenario A se dibuja completo en sus coordenadas', { skip: !rutaDataset }, () => {
    const paquete = JSON.parse(readFileSync(rutaDataset, 'utf8'));
    const grafo = cargarGrafoDesdeJson(paquete);
    assert.equal(grafo.nodos.length, 7208);
    assert.equal(grafo.tramos.length, 315);
    assert.equal(grafo.candidatas.length, 17503);
    assert.deepEqual(grafo.nodos, paquete.nodos.features.map((n) => n.geometry.coordinates));
    assert.deepEqual(grafo.ids, paquete.nodos.features.map((n) => n.id));
    assert.equal(new Set(grafo.nodos.map(String)).size, 7208);

    const escena = crearEscena(grafo);
    const contexto = contextoFalso();
    dibujarRed(contexto, escena, encuadrar(escena, 1072, 932), 1072, 932);
    assert.equal(contexto.llamadas.moveTo, 315 + 17503);
    assert.equal(contexto.llamadas.fillRect, 1 + 7208);
});
