export const vista = { k: 1, tx: 0, ty: 0, movida: false };

export const px = (pos, i) => pos.x[i] * vista.k + vista.tx;
export const py = (pos, i) => pos.y[i] * vista.k + vista.ty;

export function ajustar(pos, ancho, alto) {
    if (!pos || !pos.L || !ancho || !alto) return;
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (let i = 0; i < pos.L; i++) {
        a = Math.min(a, pos.x[i]); b = Math.min(b, pos.y[i]);
        c = Math.max(c, pos.x[i]); d = Math.max(d, pos.y[i]);
    }
    const bw = Math.max(c - a, 1), bh = Math.max(d - b, 1);
    const k = Math.max(0.2, Math.min((ancho - 80) / bw, (alto - 160) / bh, 6));
    Object.assign(vista, { k, tx: ancho / 2 - (a + bw / 2) * k, ty: alto / 2 + 10 - (b + bh / 2) * k });
}

export function zoomEn(punto, factor) {
    const k2 = Math.max(0.2, Math.min(10, vista.k * factor));
    vista.tx = punto.x - (punto.x - vista.tx) * (k2 / vista.k);
    vista.ty = punto.y - (punto.y - vista.ty) * (k2 / vista.k);
    vista.k = k2;
    vista.movida = true;
}

export function nodoEn(pos, punto) {
    if (!pos) return -1;
    let mejor = -1, distancia = 144;
    for (let i = 0; i < pos.L; i++) {
        const dx = px(pos, i) - punto.x, dy = py(pos, i) - punto.y, d = dx * dx + dy * dy;
        if (d < distancia) { distancia = d; mejor = i; }
    }
    return mejor;
}
