# Diseño y análisis de redes eléctricas

Caso 8 del curso 1ACC0184, ciclo 2026-20. Aplicación en **FastAPI** y Python,
con interfaz HTML, CSS y JavaScript dividida en módulos pequeños.

Calcula costo mínimo con Kruskal + UFDS, capacidad entre dos nodos con
Ford-Fulkerson usando BFS (Edmonds-Karp) y puntos de articulación con DFS.

## Ejecutar en Windows

Se recomienda Python 3.10 o superior; validado en Python 3.14.
Desde la carpeta del proyecto:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python app.py
```

Abrir [el panel](http://127.0.0.1:5000) o
[la documentación interactiva](http://127.0.0.1:5000/docs).
Todo funciona en el puerto 5000. Ya no se usa Flask ni un servidor separado en 8000.
La visualización y tipografías se descargan de CDN; requieren internet.

Para desarrollo con recarga:

```powershell
.\.venv\Scripts\python -m uvicorn app:app --reload --port 5000
```

## Probar la aplicación

1. Subir `dataset/dataset.json` o `dataset/conexiones.csv`.
2. Ver costo, flujo, nodos críticos y subgrafo de los primeros 100 nodos.
3. Cambiar origen y destino y pulsar **Recalcular flujo**.
4. Pulsar **Cargar otra red** para analizar otro archivo.

El dataset tiene **1500 nodos y 2767 líneas**. Sus conexiones se verificaron contra
`dataset/Dataset.pdf`. La descripción y las fuentes están en [docs/dataset.md](docs/dataset.md).
No se suben PDFs ni `precios.csv`: el lector acepta una red en JSON o CSV.

## Pruebas y consola

```powershell
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
.\.venv\Scripts\python -m pytest -q
.\.venv\Scripts\python main.py
.\.venv\Scripts\python main.py dataset/conexiones.csv --origen N-1 --destino N-2
```

La consola devuelve JSON y termina con código distinto de cero si hay un error.
Las pruebas incluyen el dataset real del repositorio, redes pequeñas calculables a
mano, desconexión, aislados, líneas paralelas, validación y una cadena de 1500 nodos.

## API

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/upload` | Multipart: `file`, `origen` y `destino` opcionales |
| GET | `/api/network-status` | Articulaciones y metadatos del último análisis |
| GET | `/api/optimization/mst` | Costo, líneas elegidas y componentes |
| GET | `/api/optimization/flow` | Flujo, corte mínimo y extremos |

La carga conserva el contrato `{"mensaje": "...", "datos": {...}}` y agrega
`aristas_mst`, `metadata.componentes` y `metadata.red_conectada`.
Errores: 400 archivo o extremos inválidos, 404 sin análisis previo, 413 archivo mayor
que 10 MiB y 422 falta el campo `file`. El mensaje está en `error`.

Los GET comparten el último resultado dentro de **un proceso**. Es una aplicación
local de demostración: no tiene sesiones por usuario ni persistencia.

## Guías del proyecto

- [Arquitectura y SOLID](docs/arquitectura.md): responsabilidades y orden de lectura.
- [Algoritmos](docs/algoritmos.md): lógica, complejidad y bibliografía.
- [Dataset](docs/dataset.md): formatos, procedencia y supuestos.
- [Rúbrica](README_RUBRICA.md): evidencia disponible y pendientes del informe.
- [Base del informe TB1](docs/informe_tb1.md): problema, datos y propuesta.
- [Publicación manual](docs/despliegue-manual.md): frontend en Cloudflare Pages y API en Render.

Para publicarlos separados, el frontend es estático y no necesita compilación.
Configurar la dirección del backend en `frontend/static/js/config.js` y los dominios
permitidos en la variable `ALLOWED_ORIGINS` del panel de Render.

El modelo supone 20 A cuando el dataset no declara capacidad. El flujo y la
robustez se analizan en la red original; el MST solo minimiza cableado.
No demuestra por sí solo que un diseño físico satisfaga demanda o tolere fallas.
