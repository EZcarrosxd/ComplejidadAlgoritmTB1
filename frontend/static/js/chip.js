export function idChip(texto) {
    const span = document.createElement('span');
    span.className = 'id';
    span.textContent = texto;
    return span;
}
