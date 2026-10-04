import { $, anunciar } from './dom.js';
import { estado, actualizar, suscribir, toca } from './state.js';
import { validarArchivo } from './errors.js';
import { analizar } from './analysis.js';
import { obtenerEjemplo } from './api.js';

const entrada = $('archivo');
const zona = $('dropzone');

function formatearBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function tomar(archivo) {
    if (!archivo) return;
    const error = validarArchivo(archivo);
    actualizar({ archivo: error ? null : archivo, error, arrastrando: false });
    anunciar(error ? error.titulo : `Archivo listo: ${archivo.name}`);
}

entrada.addEventListener('change', () => tomar(entrada.files[0]));

['dragenter', 'dragover'].forEach((tipo) => zona.addEventListener(tipo, (e) => {
    e.preventDefault();
    if (!estado.arrastrando) actualizar({ arrastrando: true });
}));
zona.addEventListener('dragleave', (e) => {
    e.preventDefault();
    actualizar({ arrastrando: false });
});
zona.addEventListener('drop', (e) => {
    e.preventDefault();
    tomar(e.dataTransfer.files[0]);
    actualizar({ arrastrando: false });
});
['dragover', 'drop'].forEach((tipo) => window.addEventListener(tipo, (e) => e.preventDefault()));

$('form-upload').addEventListener('submit', (e) => {
    e.preventDefault();
    const archivo = estado.archivo;
    if (archivo) analizar(async () => archivo, archivo.name);
});

$('btn-demo').addEventListener('click', () => analizar(obtenerEjemplo, 'Red de ejemplo'));

suscribir((s, cambios) => {
    if (!toca(cambios, 'archivo', 'arrastrando', 'error')) return;
    const archivo = s.archivo;
    zona.classList.toggle('has-file', Boolean(archivo));
    zona.classList.toggle('is-dragging', s.arrastrando);
    $('dz-title').textContent = s.arrastrando
        ? 'Suelta el archivo para cargarlo'
        : archivo ? archivo.name : 'Arrastra tu archivo aquí';
    $('dz-hint').textContent = archivo
        ? `${formatearBytes(archivo.size)}. Haz clic para elegir otro archivo.`
        : 'o haz clic para elegirlo desde tu equipo';
    if (!archivo) entrada.value = '';

    const boton = $('btn-analizar');
    boton.disabled = !archivo;
    boton.textContent = archivo ? 'Analizar red' : 'Elige un archivo primero';

    $('upload-error').hidden = !s.error;
    if (s.error) {
        $('error-titulo').textContent = s.error.titulo;
        $('error-fix').textContent = s.error.fix;
    }
});
