function recorrerPuntos(grafo, visitar) {
    for (const nodo of grafo.nodos) visitar(nodo.coordenadas);
    for (const arista of grafo.aristas) arista.trazado?.forEach(visitar);
}

function meridianoDeCorte(grafo) {
    const conjunto = new Set();
    recorrerPuntos(grafo, ([longitud]) => conjunto.add(longitud === 180 ? -180 : longitud));
    const longitudes = [...conjunto].sort((a, b) => a - b);
    let corte = longitudes[0];
    let distancia = corte + 360 - longitudes.at(-1);
    for (let i = 1; i < longitudes.length; i++) {
        const hueco = longitudes[i] - longitudes[i - 1];
        if (hueco > distancia) {
            corte = longitudes[i];
            distancia = hueco;
        }
    }
    return corte;
}

export function prepararProyeccion(grafo, caminoOriginal) {
    let oeste = Infinity, este = -Infinity, sur = Infinity, norte = -Infinity;
    recorrerPuntos(grafo, ([longitud, latitud]) => {
        oeste = Math.min(oeste, longitud);
        este = Math.max(este, longitud);
        sur = Math.min(sur, latitud);
        norte = Math.max(norte, latitud);
    });
    const corte = este - oeste > 180 ? meridianoDeCorte(grafo) : null;
    const longitudPlana = (longitud) => {
        if (corte === null) return longitud;
        const valor = longitud === 180 ? -180 : longitud;
        return valor < corte ? valor + 360 : valor;
    };

    if (corte !== null) {
        oeste = corte;
        este = corte;
        recorrerPuntos(grafo, ([longitud]) => { este = Math.max(este, longitudPlana(longitud)); });
        for (const arista of grafo.aristas) {
            const puntos = caminoOriginal(arista);
            if (puntos.some(([lon], i) => i && Math.abs(longitudPlana(lon) - longitudPlana(puntos[i - 1][0])) > 180)) {
                este = corte + 360;
                break;
            }
        }
    }

    const centroLon = (oeste + este) / 2;
    const centroLat = (sur + norte) / 2;
    const factorLon = Math.cos(centroLat * Math.PI / 180);
    const proyectar = (longitud, latitud) => [(longitud - centroLon) * factorLon, centroLat - latitud];

    function aPlano(puntos) {
        const plano = new Float64Array(puntos.length * 2);
        for (let i = 0; i < puntos.length; i++) {
            const [longitud, latitud] = puntos[i];
            plano[2 * i] = (longitudPlana(longitud) - centroLon) * factorLon;
            plano[2 * i + 1] = centroLat - latitud;
        }
        return plano;
    }

    function proyectarCamino(puntos) {
        if (corte === null) return [aPlano(puntos)];
        const caminos = [];
        let [lonAnterior, latAnterior] = puntos[0];
        lonAnterior = longitudPlana(lonAnterior);
        let actual = proyectar(lonAnterior, latAnterior);
        for (let i = 1; i < puntos.length; i++) {
            const [lon, lat] = puntos[i];
            const longitud = longitudPlana(lon);
            const diferencia = longitud - lonAnterior;
            if (Math.abs(diferencia) > 180) {
                const cruzaOeste = diferencia > 0;
                const borde = cruzaOeste ? corte : corte + 360;
                const salto = cruzaOeste ? -360 : 360;
                const latitud = latAnterior + (lat - latAnterior) * (borde - lonAnterior) / (diferencia + salto);
                actual.push(...proyectar(borde, latitud));
                caminos.push(Float64Array.from(actual));
                actual = proyectar(borde - salto, latitud);
            }
            actual.push(...proyectar(longitud, lat));
            lonAnterior = longitud;
            latAnterior = lat;
        }
        caminos.push(Float64Array.from(actual));
        return caminos;
    }

    return { aPlano, proyectarCamino, anchoPlano: (este - oeste) * factorLon, altoPlano: norte - sur };
}
