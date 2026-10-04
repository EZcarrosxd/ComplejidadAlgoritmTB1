import './upload.js';
import './flow-form.js';
import { $, form, fileInput } from './dom.js';
import { syncFileState } from './file-selection.js';
import { showView } from './views.js';
import { destruirGrafo, ajustarGrafo } from './graph.js';

$('btn-reset').addEventListener('click', () => {
    destruirGrafo();
    form.reset();
    syncFileState();
    showView('upload');
    fileInput.focus();
});
$('btn-fit').addEventListener('click', ajustarGrafo);
