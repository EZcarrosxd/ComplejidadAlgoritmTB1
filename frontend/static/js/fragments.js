export async function cargarFragmentos(contenedor) {
    for (const espacio of contenedor.querySelectorAll('[data-include]')) {
        const respuesta = await fetch(espacio.dataset.include);
        if (!respuesta.ok) throw new Error('No se pudo cargar una sección de la página.');
        const plantilla = document.createElement('template');
        plantilla.innerHTML = await respuesta.text();
        await cargarFragmentos(plantilla.content);
        espacio.replaceWith(plantilla.content);
    }
}
