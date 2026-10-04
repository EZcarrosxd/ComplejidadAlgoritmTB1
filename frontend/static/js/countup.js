import { estado } from './state.js';

const activos = new WeakMap();

export function animarNumero(elemento, hasta, formato, desde = 0) {
    const token = {};
    activos.set(elemento, token);
    const pintar = (valor) => { elemento.textContent = formato(valor); };

    if (estado.quieto) {
        pintar(hasta);
        return;
    }

    const inicio = performance.now();
    const duracion = 1400;
    const paso = () => {
        if (activos.get(elemento) !== token) return;
        const p = Math.min(1, (performance.now() - inicio) / duracion);
        if (p >= 1) {
            pintar(hasta);
            return;
        }
        pintar(desde + (hasta - desde) * (1 - Math.pow(2, -10 * p)));
        requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
}
