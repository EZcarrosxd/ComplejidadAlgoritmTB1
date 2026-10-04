import { $, fmtInt } from './dom.js';
import { idChip } from './chip.js';

export function renderCorte(lineas) {
    const nota = $('cut-note');
    if (lineas.length === 0) {
        nota.replaceChildren();
        return;
    }
    const partes = [
        lineas.length === 1
            ? 'Corte de menor capacidad: 1 línea que separa los extremos: '
            : `Corte de menor capacidad: ${fmtInt.format(lineas.length)} líneas que separan los extremos: `
    ];
    lineas.forEach((linea, i) => {
        if (i > 0) partes.push(', ');
        partes.push(idChip(`${linea.origen}–${linea.destino}`));
    });
    partes.push('.');
    nota.replaceChildren(...partes);
}
