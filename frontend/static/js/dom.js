export const $ = (id) => document.getElementById(id);

export const formatoEntero = new Intl.NumberFormat('es-PE');
export const formatoNumero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });
export const formatoMoneda = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatoSegundos = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 });

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
    destino.scrollIntoView({ block: 'start' });
}

export function plural(n, singular, varios) {
    return `${formatoEntero.format(n)} ${n === 1 ? singular : varios}`;
}
