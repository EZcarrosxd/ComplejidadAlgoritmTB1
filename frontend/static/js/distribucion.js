const CANTIDAD_PIVOTES = 50;
const LARGO_LINEA = 16;
const VUELTAS_POTENCIA = 120;

export function crearVecinos(cantidad, aristas) {
    const vecinos = Array.from({ length: cantidad }, () => []);
    for (const [a, b] of aristas) {
        vecinos[a].push(b);
        vecinos[b].push(a);
    }
    return vecinos;
}

function distanciasDesde(vecinos, origen) {
    const distancia = new Float32Array(vecinos.length).fill(-1);
    const cola = [origen];
    distancia[origen] = 0;
    for (let k = 0; k < cola.length; k++) {
        const actual = cola[k];
        for (const vecino of vecinos[actual]) {
            if (distancia[vecino] >= 0) continue;
            distancia[vecino] = distancia[actual] + 1;
            cola.push(vecino);
        }
    }
    let maxima = 0;
    for (const d of distancia) maxima = Math.max(maxima, d);
    return distancia.map((d) => (d < 0 ? maxima + 1 : d));
}

function elegirPivotes(vecinos) {
    const cantidad = vecinos.length;
    const columnas = [];
    const cercania = new Float32Array(cantidad).fill(Infinity);
    let siguiente = 0;
    for (let p = 0; p < Math.min(CANTIDAD_PIVOTES, cantidad); p++) {
        const distancias = distanciasDesde(vecinos, siguiente);
        columnas.push(distancias);
        let lejano = 0;
        for (let i = 0; i < cantidad; i++) {
            cercania[i] = Math.min(cercania[i], distancias[i]);
            if (cercania[i] > cercania[lejano]) lejano = i;
        }
        siguiente = lejano;
    }
    return columnas;
}

function vectorPrincipal(matriz, quitar) {
    let v = matriz.map((_, i) => Math.sin(i + 1));
    for (let vuelta = 0; vuelta < VUELTAS_POTENCIA; vuelta++) {
        if (quitar) {
            const proyeccion = v.reduce((suma, valor, i) => suma + valor * quitar[i], 0);
            v = v.map((valor, i) => valor - proyeccion * quitar[i]);
        }
        const siguiente = matriz.map((fila) => fila.reduce((suma, valor, j) => suma + valor * v[j], 0));
        const norma = Math.hypot(...siguiente) || 1;
        v = siguiente.map((valor) => valor / norma);
    }
    return v;
}

function centrarDistancias(columnas, cantidad) {
    const cuadrados = columnas.map((columna) => columna.map((d) => d * d));
    const mediaColumna = cuadrados.map((columna) => columna.reduce((a, b) => a + b, 0) / cantidad);
    const mediaFila = new Float32Array(cantidad);
    for (const columna of cuadrados) {
        for (let i = 0; i < cantidad; i++) mediaFila[i] += columna[i] / cuadrados.length;
    }
    const mediaTotal = mediaColumna.reduce((a, b) => a + b, 0) / cuadrados.length;
    return cuadrados.map((columna, p) =>
        columna.map((valor, i) => -0.5 * (valor - mediaFila[i] - mediaColumna[p] + mediaTotal)));
}

function calcularPivotMds(cantidad, aristas, vecinos) {
    const x = new Float32Array(cantidad);
    const y = new Float32Array(cantidad);
    if (cantidad < 3) return { x, y };

    const centrada = centrarDistancias(elegirPivotes(vecinos), cantidad);
    const producto = centrada.map((a) => centrada.map((b) => a.reduce((suma, valor, i) => suma + valor * b[i], 0)));
    const primero = vectorPrincipal(producto);
    const segundo = vectorPrincipal(producto, primero);
    centrada.forEach((columna, p) => {
        for (let i = 0; i < cantidad; i++) {
            x[i] += columna[i] * primero[p];
            y[i] += columna[i] * segundo[p];
        }
    });

    const largoMedio = aristas.reduce((suma, [a, b]) => suma + Math.hypot(x[a] - x[b], y[a] - y[b]), 0) / Math.max(aristas.length, 1);
    const escala = LARGO_LINEA / (largoMedio || 1);
    for (let i = 0; i < cantidad; i++) {
        x[i] *= escala;
        y[i] *= escala;
    }
    return { x, y };
}

export function crearPosiciones(ids, aristas, vecinos, previo) {
    const reutilizable = previo && previo.ids.length === ids.length && ids.every((id) => previo.indices.has(id));
    if (reutilizable) {
        const x = new Float32Array(ids.length);
        const y = new Float32Array(ids.length);
        ids.forEach((id, i) => {
            const anterior = previo.indices.get(id);
            x[i] = previo.pos.x[anterior];
            y[i] = previo.pos.y[anterior];
        });
        return { cantidad: ids.length, x, y };
    }
    return { cantidad: ids.length, ...calcularPivotMds(ids.length, aristas, vecinos) };
}
