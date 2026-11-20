import { estado, actualizar } from './estado.js';
import { anunciar, plural } from './dom.js';
import { describirFalla } from './modelo.js';
import { recalcularFlujo } from './flujo.js';

const NOMBRES = { general: 'Mapa', mst: 'Menor costo', flujo: 'Capacidad', fallas: 'Puntos débiles' };

export function cambiarModo(modo) {
    if (estado.modo === modo) return;
    actualizar({ modo });
    anunciar(`Vista: ${NOMBRES[modo]}`);
}

export function simularFalla(id) {
    const falla = describirFalla(estado.modelo, id);
    actualizar({ falla });
    anunciar(falla.perdidos
        ? `Si falla ${id}, ${plural(falla.perdidos, 'punto queda', 'puntos quedan')} sin luz`
        : `Si falla ${id}, la red sigue funcionando`);
}

export function restaurar() {
    if (!estado.falla) return;
    actualizar({ falla: null });
    anunciar('Nodo restaurado');
}

export function clicEnNodo(i) {
    const id = estado.modelo.ids[i];
    if (estado.modo === 'flujo') {
        if (estado.calculando) return;
        if (estado.siguiente === 'origen') {
            actualizar({ origen: id, siguiente: 'destino', errorFlujo: '' });
            anunciar(`Origen: ${id}\nAhora elige el destino`);
        } else {
            actualizar({ destino: id, siguiente: 'origen', errorFlujo: '' });
            recalcularFlujo(estado.origen, id);
        }
    } else if (estado.modo === 'fallas') {
        simularFalla(id);
    } else {
        actualizar({ sel: id });
        anunciar(`Punto ${id} seleccionado`);
    }
}
