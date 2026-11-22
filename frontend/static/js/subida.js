import { $, anunciar } from './dom.js';
import { estado, actualizar, suscribir, toca } from './estado.js';
import { validarArchivo } from './errores.js';
import { esJsonGeografico } from './datos-georreferenciados.js';
import { mostrarRedGeografica } from './vista-geografica.js';
import { analizar } from './analisis.js';
import { obtenerEjemplo } from './api.js';

const entrada = $('archivo');
const TEXTO_ANALISIS = 'Responde cinco preguntas sobre tu red\nCosto, capacidad, rutas, fallas y refuerzo';
const TEXTO_GEOGRAFICO = 'Dibuja las estructuras en sus coordenadas WGS 84 originales\nSe lee en tu navegador y no se envía al servidor';
const zona = $('dropzone');

function formatearBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

async function tomar(archivo) {
    if (!archivo) return;
    const geografico = await esJsonGeografico(archivo);
    const error = validarArchivo(archivo, geografico);
    actualizar({ archivo: error ? null : archivo, geografico: !error && geografico, error, arrastrando: false });
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
    if (!archivo) return;
    if (estado.geografico) abrirGeografica(archivo);
    else analizar(async () => archivo, archivo.name);
});

async function abrirGeografica(archivo) {
    const boton = $('btn-analizar');
    boton.disabled = true;
    try {
        await mostrarRedGeografica(archivo);
    } catch (problema) {
        const titulo = problema instanceof SyntaxError ? 'El archivo no contiene JSON válido' : problema.message;
        const error = { titulo, indicacion: 'Elige el archivo dataset_osinergmin_A.json sin modificar' };
        actualizar({ archivo: null, geografico: false, error });
        anunciar(error.titulo);
    } finally {
        boton.disabled = !estado.archivo;
    }
}

$('btn-demo').addEventListener('click', () => analizar(obtenerEjemplo, 'Red de ejemplo'));

suscribir((s, cambios) => {
    if (!toca(cambios, 'archivo', 'arrastrando', 'error', 'geografico')) return;
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
    $('titulo-panel-analizar').textContent = s.geografico ? 'Red georreferenciada' : 'Analizar red';
    $('texto-panel-analizar').textContent = s.geografico ? TEXTO_GEOGRAFICO : TEXTO_ANALISIS;
    $('btn-analizar-texto').textContent = s.geografico ? 'Ver red georreferenciada' : 'Analizar red';
    $('panel-analizar').hidden = !elegido;
    $('upload-alternativa').hidden = elegido;

    $('upload-error').hidden = !s.error;
    if (s.error) {
        $('error-titulo').textContent = s.error.titulo;
        $('error-indicacion').textContent = s.error.indicacion;
    }
});
