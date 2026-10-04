import { $, fileInput, dropzone, btnSubmit } from './dom.js';
import { hideError } from './views.js';

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function syncFileState() {
    const file = fileInput.files[0];
    dropzone.classList.toggle('has-file', Boolean(file));
    btnSubmit.disabled = !file;
    hideError();

    if (file) {
        $('dz-title').textContent = file.name;
        $('dz-hint').textContent = `${formatBytes(file.size)}. Haz clic para elegir otro archivo.`;
    } else {
        $('dz-title').textContent = 'Arrastra tu archivo aquí';
        $('dz-hint').textContent = 'o haz clic para elegirlo desde tu equipo';
    }
}

fileInput.addEventListener('change', syncFileState);

['dragenter', 'dragover'].forEach((tipo) => dropzone.addEventListener(tipo, (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach((tipo) => dropzone.addEventListener(tipo, (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragging');
}));
dropzone.addEventListener('drop', (e) => {
    if (!fileInput.disabled && e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        syncFileState();
    }
});
['dragover', 'drop'].forEach((tipo) => window.addEventListener(tipo, (e) => e.preventDefault()));
