const ALTERNATIVA = 'A_k4';

function leerColeccion(coleccion, descripcion) {
    if (coleccion?.type !== 'FeatureCollection' || !Array.isArray(coleccion.features)) {
        throw new Error(`${descripcion} debe ser una colección GeoJSON`);
    }
    return coleccion.features;
}

function validarCoordenada(coordenada) {
    if (!Array.isArray(coordenada) || coordenada.length !== 2 ||
        !coordenada.every(Number.isFinite) || Math.abs(coordenada[0]) > 180 || Math.abs(coordenada[1]) > 90) {
        throw new Error('Se esperaban coordenadas WGS 84 en orden longitud, latitud');
    }
}

function mismoPunto(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}

function leerAristas(coleccion, clase, nodos, ids, alternativa) {
    const trazados = [];
    for (const arista of leerColeccion(coleccion, clase)) {
        const datos = arista?.properties;
        if (datos?.clase !== clase || (alternativa && !Array.isArray(datos.alternativas))) {
            throw new Error('Una arista no tiene la clase o la alternativa esperada');
        }
        if (alternativa && !datos.alternativas.includes(alternativa)) continue;

        const inicio = nodos.get(datos.origen), fin = nodos.get(datos.destino);
        const camino = arista.geometry?.coordinates;
        if (typeof arista.id !== 'string' || !arista.id || ids.has(arista.id) ||
            !inicio || !fin || datos.origen === datos.destino ||
            arista.geometry?.type !== 'LineString' || !Array.isArray(camino) || camino.length < 2) {
            throw new Error('Una arista tiene un identificador, extremos o geometría inválidos');
        }
        camino.forEach(validarCoordenada);
        if (!mismoPunto(camino[0], inicio) || !mismoPunto(camino.at(-1), fin)) {
            throw new Error('Los extremos de una arista no coinciden con sus nodos');
        }
        ids.add(arista.id);
        trazados.push(camino);
    }
    return trazados;
}

export function cargarGrafoGeorreferenciado(coleccionNodos, coleccionTramos, coleccionCandidatas) {
    const nodos = new Map();
    for (const nodo of leerColeccion(coleccionNodos, 'Nodos')) {
        if (typeof nodo?.id !== 'string' || !nodo.id || nodos.has(nodo.id) ||
            nodo.geometry?.type !== 'Point' || nodo.properties?.tipo_nodo !== 'estructura_bt') {
            throw new Error('Cada estructura debe tener un identificador único y una geometría Point');
        }
        validarCoordenada(nodo.geometry.coordinates);
        nodos.set(nodo.id, nodo.geometry.coordinates);
    }
    if (!nodos.size) throw new Error('El archivo de nodos no contiene estructuras');

    const ids = new Set();
    return {
        ids: [...nodos.keys()],
        nodos: [...nodos.values()],
        tramos: leerAristas(coleccionTramos, 'tramo_documentado', nodos, ids),
        candidatas: leerAristas(coleccionCandidatas, 'candidata_geografica', nodos, ids, ALTERNATIVA),
    };
}

export function cargarGrafoDesdeJson(paquete) {
    if (paquete?.tipo !== 'grafo_georreferenciado' || paquete.version !== 1 ||
        paquete.alternativa !== ALTERNATIVA || paquete.sistema_coordenadas !== 'EPSG:4326') {
        throw new Error('Elige un JSON georreferenciado del escenario A con coordenadas WGS 84');
    }
    const { nodos, tramos_documentados, conexiones_candidatas } = paquete;
    const grafo = cargarGrafoGeorreferenciado(nodos, tramos_documentados, conexiones_candidatas);
    if (grafo.candidatas.length !== conexiones_candidatas.features.length) {
        throw new Error('El JSON contiene conexiones candidatas ajenas al escenario A');
    }
    return grafo;
}

const MARCA_GEOGRAFICA = /"tipo"\s*:\s*"grafo_georreferenciado"/;

export async function esJsonGeografico(archivo) {
    if (!/\.json$/i.test(archivo.name)) return false;
    return MARCA_GEOGRAFICA.test(await archivo.slice(0, 2048).text());
}
