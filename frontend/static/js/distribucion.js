export function crearPosiciones(ids, previo) {
    const cantidad = ids.length;
    const x = new Float32Array(cantidad);
    const y = new Float32Array(cantidad);
    let nuevos = 0;

    ids.forEach((id, i) => {
        const indicePrevio = previo?.indices.get(id);
        if (indicePrevio !== undefined) {
            x[i] = previo.pos.x[indicePrevio];
            y[i] = previo.pos.y[indicePrevio];
            return;
        }
        const radio = 9 * Math.sqrt(i + 1);
        const angulo = i * 2.39996;
        x[i] = radio * Math.cos(angulo);
        y[i] = radio * Math.sin(angulo);
        nuevos++;
    });

    let intensidad = 1;
    if (previo) intensidad = nuevos > 0 ? 0.5 : 0;
    return { cantidad, x, y, vx: new Float32Array(cantidad), vy: new Float32Array(cantidad), intensidad };
}

function moverNodos(pos, aristas) {
    const { cantidad, x, y, vx, vy } = pos;
    const intensidad = Math.max(pos.intensidad, 0.05);

    for (let i = 0; i < cantidad; i++) {
        for (let j = i + 1; j < cantidad; j++) {
            const dx = x[i] - x[j], dy = y[i] - y[j], d2 = dx * dx + dy * dy + 0.01;
            if (d2 > 40000) continue;
            const fuerza = 90 / d2 * intensidad;
            vx[i] += dx * fuerza;
            vy[i] += dy * fuerza;
            vx[j] -= dx * fuerza;
            vy[j] -= dy * fuerza;
        }
    }

    for (const [u, v] of aristas) {
        const dx = x[v] - x[u], dy = y[v] - y[u];
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const fuerza = (d - 26) / d * 0.08 * intensidad;
        vx[u] += dx * fuerza;
        vy[u] += dy * fuerza;
        vx[v] -= dx * fuerza;
        vy[v] -= dy * fuerza;
    }

    for (let i = 0; i < cantidad; i++) {
        vx[i] -= x[i] * 0.004 * intensidad;
        vy[i] -= y[i] * 0.004 * intensidad;
        vx[i] *= 0.6;
        vy[i] *= 0.6;
        x[i] += vx[i];
        y[i] += vy[i];
    }
}

function avanzar(pos, aristas) {
    if (pos.intensidad < 0.004) return false;
    for (let i = 0; i < 3; i++) moverNodos(pos, aristas);
    pos.intensidad *= 0.975;
    return true;
}

export function asentar(pos, aristas) {
    while (avanzar(pos, aristas));
    pos.intensidad = 0;
}
