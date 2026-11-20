import { $, anunciar } from './dom.js';
import { estado, actualizar, suscribir, toca } from './estado.js';
import { validarArchivo } from './errores.js';
import { analizar } from './analisis.js';
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
    const elegido = Boolean(archivo);
    zona.classList.toggle('has-file', elegido);
    zona.classList.toggle('is-dragging', s.arrastrando);
    $('dz-title').textContent = elegido ? 'Cambiar archivo' : 'Seleccionar archivo';
    $('dz-hint').textContent = s.arrastrando ? 'Suelta el archivo aquí' : 'o arrástralo aquí';
    $('dz-hint').hidden = elegido && !s.arrastrando;
    $('archivo-elegido').hidden = !elegido;
    $('archivo-nombre').textContent = archivo?.name ?? '';
    $('archivo-tipo').textContent = archivo?.name.split('.').pop().toUpperCase() ?? '';
    $('inicio').classList.toggle('con-archivo', elegido);    $('archivo-tamano').textContent = elegido ? formatearBytes(archivo.size) : '';
    if (!archivo) entrada.value = '';

    const boton = $('btn-analizar');
    boton.disabled = !elegido;
    $('panel-analizar').hidden = !elegido;
    $('upload-alternativa').hidden = elegido;

    $('upload-error').hidden = !s.error;
    if (s.error) {
        $('error-titulo').textContent = s.error.titulo;
        $('error-indicacion').textContent = s.error.indicacion;
    }
});
