import { estado, actualizar } from './estado.js';
import { analizarRed, conLimiteDeEspera, LIMITE_ESPERA_MINUTOS } from './api.js';
import { explicarError } from './errores.js';
import { crearModelo } from './modelo.js';
import { anunciar, formatoMoneda, formatoNumero, formatoSegundos } from './dom.js';

const PASOS = [
    ['Enviando el archivo', ''],
    ['Menor costo', 'Kruskal'],
    ['Puntos débiles', 'Búsqueda en profundidad'],
    ['Capacidad', 'Ford-Fulkerson'],
    ['Dibujando el mapa', ''],
];
const AVISO_INICIO = `El servidor puede estar iniciándose\nLa espera máxima es de ${LIMITE_ESPERA_MINUTOS} minutos`;

let trabajo = null;

function paso(i, cambios) {
    actualizar({ pasos: estado.pasos.map((p, j) => (j === i ? { ...p, ...cambios } : p)) });
}

function reiniciar(nombre) {
    actualizar({
        fase: 'progreso', error: null, modo: 'mst', sel: null, falla: null, todosCriticos: false,
        errorFlujo: '', previo: null, siguiente: 'origen',
        pasos: PASOS.map(([titulo, detalle]) => ({ titulo, detalle, estado: 'pendiente', mensaje: 'En espera' })),
    });
    paso(0, { estado: 'en-curso', mensaje: 'Enviando', detalle: nombre });
    anunciar(`Analizando ${nombre}`);
}

export async function analizar(obtenerArchivo, nombre) {
    const control = new AbortController();
    trabajo = control;
    reiniciar(nombre);
    const aviso = setTimeout(() => paso(0, { detalle: AVISO_INICIO }), 6000);
    const inicio = performance.now();

    try {
        const { archivo, datos } = await conLimiteDeEspera(async (senal) => {
            const archivo = await obtenerArchivo(senal);
            const datos = await analizarRed(archivo, { senal });
            return { archivo, datos };
        }, control);
        clearTimeout(aviso);
        if (trabajo !== control) return;
        const segundos = formatoSegundos.format((performance.now() - inicio) / 1000);
        const modelo = crearModelo(datos, null);
        const meta = datos.metadata;
        const pasos = estado.pasos.map((p, i) => i === 0
            ? { ...p, estado: 'listo', mensaje: `${segundos} s`, detalle: archivo.name }
            : { ...p, estado: 'listo', mensaje: 'Listo' });
        actualizar({ pasos });
        actualizar({ fase: 'resultados', archivo, datos, modelo, origen: meta.origen_flujo, destino: meta.destino_flujo });
        anunciar(`Análisis listo\nCosto mínimo S/ ${formatoMoneda.format(datos.costo_minimo_instalacion)}, `
            + `capacidad ${formatoNumero.format(datos.flujo_maximo_red)} A y ${datos.nodos_criticos.length} puntos débiles`);
    } catch (fallo) {
        clearTimeout(aviso);
        if (trabajo !== control) return;
        const error = explicarError(fallo);
        actualizar({ fase: 'subida', error });
        anunciar(error.titulo);
    } finally {
        if (trabajo === control) trabajo = null;
    }
}

export function cancelar() {
    if (trabajo) trabajo.abort();
    trabajo = null;
    actualizar({ fase: 'subida' });
    anunciar('Análisis cancelado');
}
