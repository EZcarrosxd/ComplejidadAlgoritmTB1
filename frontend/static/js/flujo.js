import { estado, actualizar } from './estado.js';
import { analizarRed, conLimiteDeEspera } from './api.js';
import { explicarError } from './errores.js';
import { crearModelo, describirFalla } from './modelo.js';
import { anunciar, formatoNumero } from './dom.js';

function validar(origen, destino) {
    const ids = new Set(estado.datos.metadata.ids_nodos);
    if (!origen || !destino) return 'Escribe un origen y un destino o elige dos puntos en el mapa';
    if (!ids.has(origen)) return `No existe el punto "${origen}"\nRevisa el nombre, por ejemplo N-1`;
    if (!ids.has(destino)) return `No existe el punto "${destino}"\nRevisa el nombre, por ejemplo N-2`;
    if (origen === destino) return 'El origen y el destino deben ser distintos';
    return '';
}

export async function recalcularFlujo(origen, destino, registrar = true) {
    origen = String(origen || '').trim();
    destino = String(destino || '').trim();
    const error = validar(origen, destino);
    if (error) {
        actualizar({ errorFlujo: error });
        anunciar(error);
        return;
    }

    const meta = estado.datos.metadata;
    const previo = registrar ? { origen: meta.origen_flujo, destino: meta.destino_flujo } : null;
    actualizar({ calculando: true, errorFlujo: '', origen, destino, siguiente: 'origen' });

    try {
        const datos = await conLimiteDeEspera((senal) => analizarRed(estado.archivo, { origen, destino, senal }));
        const modelo = crearModelo(datos, estado.modelo);
        actualizar({
            datos,
            modelo,
            previo,
            calculando: false,
            falla: estado.falla ? describirFalla(modelo, estado.falla.id) : null,
            sel: modelo.indices.has(estado.sel) ? estado.sel : null,
        });
        anunciar(`Capacidad de ${origen} a ${destino}: ${formatoNumero.format(datos.flujo_maximo_red)} A`);
    } catch (fallo) {
        const explicado = explicarError(fallo);
        actualizar({ calculando: false, errorFlujo: explicado.titulo });
        anunciar(explicado.titulo);
    }
}

export function deshacerFlujo() {
    const previo = estado.previo;
    if (!previo) return;
    recalcularFlujo(previo.origen, previo.destino, false);
}
