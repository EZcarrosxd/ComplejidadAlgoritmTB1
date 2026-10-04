import { estado } from './state.js';

export const $ = (id) => document.getElementById(id);

export const fmtInt = new Intl.NumberFormat('es-PE');
export const fmtNum = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });
export const fmtMoney = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtSeg = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 });

export function anunciar(texto) {
    $('anuncio').textContent = texto;
}

export function crear(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

export function irA(id) {
    const destino = $(id);
    if (!destino) return;
    const top = destino.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: estado.quieto ? 'auto' : 'smooth' });
}

export function plural(n, singular, varios) {
    return `${fmtInt.format(n)} ${n === 1 ? singular : varios}`;
}
