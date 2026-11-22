const CLASES = new Set(['tramo_documentado', 'candidata_geografica']);

function tieneCampos(objeto, obligatorios, opcionales = []) {
    return objeto !== null && typeof objeto === 'object' && !Array.isArray(objeto)
        && obligatorios.every((campo) => Object.hasOwn(objeto, campo))
        && Object.keys(objeto).every((campo) => obligatorios.includes(campo) || opcionales.includes(campo));
}

const identificadorValido = (id) => typeof id === 'string' && id.trim() !== '';
const mismoPunto = (a, b) => a[0] === b[0] && a[1] === b[1];

function validarCoordenadas(punto) {
    if (!Array.isArray(punto) || punto.length !== 2 || !punto.every(Number.isFinite)
        || Math.abs(punto[0]) > 180 || Math.abs(punto[1]) > 90) {
        throw new Error('Usa coordenadas WGS 84 en orden longitud, latitud');
    }
}

export function cargarGrafoDesdeJson(grafo) {
    if (!tieneCampos(grafo, ['nodos', 'aristas']) || !Array.isArray(grafo.nodos)
        || !grafo.nodos.length || !Array.isArray(grafo.aristas)) {
        throw new Error('El JSON debe contener una lista de nodos y una lista de aristas');
    }

    const posiciones = new Map();
    for (const nodo of grafo.nodos) {
        if (!tieneCampos(nodo, ['id', 'coordenadas']) || !identificadorValido(nodo.id)) {
            throw new Error('Cada nodo debe tener un ID y sus coordenadas');
        }
        if (posiciones.has(nodo.id)) throw new Error(`El identificador de nodo ${nodo.id} está repetido`);
        validarCoordenadas(nodo.coordenadas);
        posiciones.set(nodo.id, nodo.coordenadas);
    }

    const ids = new Set();
    for (const arista of grafo.aristas) {
        if (!tieneCampos(arista, ['id', 'origen', 'destino', 'peso_mm', 'clase'], ['trazado'])
            || !identificadorValido(arista.id)) {
            throw new Error('Una arista tiene campos o identificador inválidos');
        }
        if (ids.has(arista.id)) throw new Error(`El identificador de arista ${arista.id} está repetido`);
        ids.add(arista.id);
        if (!CLASES.has(arista.clase)) throw new Error(`La arista ${arista.id} tiene una clase inválida`);
        if (!Number.isSafeInteger(arista.peso_mm) || arista.peso_mm <= 0) {
            throw new Error(`La arista ${arista.id} debe tener un peso entero positivo en milímetros`);
        }
        const inicio = posiciones.get(arista.origen), fin = posiciones.get(arista.destino);
        if (!inicio || !fin || arista.origen === arista.destino) {
            throw new Error(`La arista ${arista.id} tiene extremos inválidos`);
        }
        if (Object.hasOwn(arista, 'trazado')) {
            const camino = arista.trazado;
            if (!Array.isArray(camino) || camino.length < 3) {
                throw new Error(`El trazado de ${arista.id} requiere al menos un punto intermedio`);
            }
            camino.forEach(validarCoordenadas);
            if (!mismoPunto(camino[0], inicio) || !mismoPunto(camino.at(-1), fin)) {
                throw new Error(`El trazado de ${arista.id} debe comenzar en el origen y terminar en el destino`);
            }
        }
    }
    return grafo;
}
