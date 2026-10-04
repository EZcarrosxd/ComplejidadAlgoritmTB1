// Distribución visual de fuerzas para dibujar el subgrafo; no calcula resultados de la red.

export function crearPosiciones(ids, previo) {
    const L = ids.length;
    const x = new Float32Array(L);
    const y = new Float32Array(L);
    let nuevos = 0;

    ids.forEach((id, i) => {
        const j = previo ? previo.idx.get(id) : undefined;
        if (j !== undefined) {
            x[i] = previo.pos.x[j];
            y[i] = previo.pos.y[j];
            return;
        }
        const radio = 9 * Math.sqrt(i + 1);
        const angulo = i * 2.39996;
        x[i] = radio * Math.cos(angulo);
        y[i] = radio * Math.sin(angulo);
        nuevos++;
    });

    const alpha = !previo ? 1 : nuevos ? 0.5 : 0;
    return { L, x, y, vx: new Float32Array(L), vy: new Float32Array(L), alpha };
}

function tick(pos, aristas) {
    const { L, x, y, vx, vy } = pos;
    const a = Math.max(pos.alpha, 0.05);

    for (let i = 0; i < L; i++) {
        for (let j = i + 1; j < L; j++) {
            const dx = x[i] - x[j], dy = y[i] - y[j], d2 = dx * dx + dy * dy + 0.01;
            if (d2 > 40000) continue;
            const f = 90 / d2 * a;
            vx[i] += dx * f; vy[i] += dy * f; vx[j] -= dx * f; vy[j] -= dy * f;
        }
    }

    for (const [u, v] of aristas) {
        const dx = x[v] - x[u], dy = y[v] - y[u];
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = (d - 26) / d * 0.08 * a;
        vx[u] += dx * f; vy[u] += dy * f; vx[v] -= dx * f; vy[v] -= dy * f;
    }

    for (let i = 0; i < L; i++) {
        vx[i] -= x[i] * 0.004 * a; vy[i] -= y[i] * 0.004 * a;
        vx[i] *= 0.6; vy[i] *= 0.6;
        x[i] += vx[i]; y[i] += vy[i];
    }
}

export function avanzar(pos, aristas) {
    if (pos.alpha < 0.004) return false;
    for (let i = 0; i < 3; i++) tick(pos, aristas);
    pos.alpha *= 0.975;
    return true;
}

export function asentar(pos, aristas) {
    while (avanzar(pos, aristas));
    pos.alpha = 0;
}
