import { estado, actualizar } from './state.js';
import { analizarRed } from './api.js';
import { explicarError } from './errors.js';
import { crearModelo } from './model.js';
import { asentar } from './layout.js';
import { anunciar, fmtMoney, fmtNum, fmtSeg } from './dom.js';

const PASOS = [
    ['Enviando el archivo', ''],
    ['Menor costo', 'Kruskal'],
    ['Puntos débiles', 'Búsqueda en profundidad'],
    ['Capacidad', 'Ford-Fulkerson'],
    ['Dibujando el mapa', ''],
];
const AVISO_INICIO = 'El servidor puede estar iniciándose; la primera vez tarda hasta un minuto.';

let trabajo = null;

const esperar = (ms) => new Promise((listo) => setTimeout(listo, estado.quieto ? 0 : ms));

function paso(i, cambios) {
    actualizar({ pasos: estado.pasos.map((p, j) => (j === i ? { ...p, ...cambios } : p)) });
}

function reiniciar(nombre) {
    actualizar({
        fase: 'loading', error: null, modo: 'general', sel: null, falla: null, todosCriticos: false,
        errorFlujo: '', previo: null, siguiente: 'origen',
        pasos: PASOS.map(([label, detalle]) => ({ label, detalle, estado: 'wait', status: 'En espera' })),
    });
    paso(0, { estado: 'run', status: 'Enviando…', detalle: nombre });
    anunciar(`Analizando ${nombre}`);
}

export async function analizar(obtenerArchivo, nombre) {
    const control = new AbortController();
    trabajo = control;
    reiniciar(nombre);
    const aviso = setTimeout(() => paso(0, { detalle: AVISO_INICIO }), 6000);
    const inicio = performance.now();

    try {
        const archivo = await obtenerArchivo(control.signal);
        const datos = await analizarRed(archivo, { signal: control.signal });
        clearTimeout(aviso);
        const segundos = fmtSeg.format((performance.now() - inicio) / 1000);
        paso(0, { estado: 'done', status: `${segundos} s`, detalle: archivo.name });

        for (const i of [1, 2, 3]) {
            await esperar(220);
            if (trabajo !== control) return;
            paso(i, { estado: 'done', status: 'Listo' });
        }

        paso(4, { estado: 'run', status: 'Dibujando…' });
        await esperar(120);
        const modelo = crearModelo(datos, null);
        if (estado.quieto) asentar(modelo.pos, modelo.aristas);
        paso(4, { estado: 'done', status: 'Listo' });
        await esperar(300);
        if (trabajo !== control) return;

        const meta = datos.metadata;
        actualizar({ fase: 'results', archivo, datos, modelo, origen: meta.origen_flujo, destino: meta.destino_flujo });
        anunciar(`Análisis listo. Costo mínimo S/ ${fmtMoney.format(datos.costo_minimo_instalacion)}, `
            + `capacidad ${fmtNum.format(datos.flujo_maximo_red)} A, ${datos.nodos_criticos.length} puntos débiles.`);
    } catch (fallo) {
        clearTimeout(aviso);
        if (trabajo !== control) return;
        const error = explicarError(fallo);
        actualizar({ fase: 'upload', error });
        anunciar(error.titulo);
    }
}

export function cancelar() {
    if (trabajo) trabajo.abort();
    trabajo = null;
    actualizar({ fase: 'upload' });
    anunciar('Análisis cancelado');
}
