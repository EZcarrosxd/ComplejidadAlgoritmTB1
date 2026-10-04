import { px, py } from './camera.js';

const particulas = [];

export function limpiarParticulas() {
    particulas.length = 0;
}

function nueva(pool) {
    return {
        e: pool[Math.floor(Math.random() * pool.length)],
        p: 0,
        dir: Math.random() < 0.5 ? 1 : -1,
        sp: 0.0006 + Math.random() * 0.0012,
    };
}

export function dibujarParticulas(c, pool, color, dt) {
    const { ctx, pos, quieto } = c;
    const cantidad = quieto || !pool || !pool.length ? 0 : 45;
    while (particulas.length < cantidad) particulas.push(nueva(pool));
    particulas.length = Math.min(particulas.length, cantidad);

    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (const q of particulas) {
        q.p += q.sp * dt;
        if (q.p >= 1 || !pool.includes(q.e)) Object.assign(q, nueva(pool));
        const [a, b] = q.dir > 0 ? q.e : [q.e[1], q.e[0]];
        const ax = px(pos, a), ay = py(pos, a), bx = px(pos, b), by = py(pos, b);
        const x = ax + (bx - ax) * q.p, y = ay + (by - ay) * q.p, p0 = Math.max(0, q.p - 0.3);
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * p0, ay + (by - ay) * p0); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillRect(x - 2, y - 2, 4, 4);
    }
}
