import { $, anunciar } from './dom.js';
import { actualizar, suscribir, toca } from './estado.js';
import { validarArchivo, explicarError } from './errores.js';
import { cargarGrafoDesdeJson } from './datos-georreferenciados.js';
import { mostrarRedGeografica } from './vista-geografica.js';
import { conLimiteDeEspera, obtenerEjemplo } from './api.js';

const entrada = $('archivo');
const zona = $('dropzone');
let cargaActual = 0;

async function cargar(obtenerArchivo) {
    const carga = ++cargaActual;
    actualizar({ error: null });
    $('estado-carga').textContent = 'Cargando red';
    try {
        const archivo = await obtenerArchivo();
        if (carga !== cargaActual) return;
        const problema = validarArchivo(archivo);
        if (problema) {
            actualizar({ error: problema });
            return;
        }
        const grafo = cargarGrafoDesdeJson(JSON.parse(await archivo.text()));
        if (carga === cargaActual) mostrarRedGeografica(grafo, archivo.name);
    } catch (problema) {
        if (carga !== cargaActual) return;
        const titulo = problema instanceof SyntaxError ? 'El archivo no contiene JSON válido' : problema.message;
        actualizar({ error: { titulo, indicacion: 'Revisa el formato de nodos y aristas' } });
    } finally {
        if (carga === cargaActual) {
            $('estado-carga').textContent = '';
            entrada.value = '';
        }
    }
}

function tomar(archivo) {
    if (archivo) cargar(() => archivo);
}

entrada.addEventListener('change', () => tomar(entrada.files[0]));
['dragenter', 'dragover'].forEach((tipo) => zona.addEventListener(tipo, (evento) => {
    evento.preventDefault();
    zona.classList.add('is-dragging');
}));
zona.addEventListener('dragleave', () => zona.classList.remove('is-dragging'));
zona.addEventListener('drop', (evento) => {
    evento.preventDefault();
    zona.classList.remove('is-dragging');
    tomar(evento.dataTransfer.files[0]);
});
['dragover', 'drop'].forEach((tipo) => window.addEventListener(tipo, (evento) => evento.preventDefault()));

$('btn-demo').addEventListener('click', () => cargar(async () => {
    try {
        return await conLimiteDeEspera(obtenerEjemplo);
    } catch (problema) {
        throw new Error(explicarError(problema).titulo);
    }
}));

suscribir((estado, cambios) => {
    if (!toca(cambios, 'error')) return;
    $('upload-error').hidden = !estado.error;
    if (estado.error) {
        $('error-titulo').textContent = estado.error.titulo;
        $('error-indicacion').textContent = estado.error.indicacion;
        anunciar(estado.error.titulo);
    }
});
