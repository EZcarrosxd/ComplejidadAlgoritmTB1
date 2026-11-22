# Diseño y análisis de redes eléctricas

Caso 8 del curso 1ACC0184, ciclo 2026-20

El aplicativo carga una red eléctrica georreferenciada desde un JSON con `nodos` y `aristas` y dibuja el grafo en Canvas

Kruskal y Prim calculan la longitud mínima de cableado usando el peso en milímetros de cada arista
BFS cuenta las componentes conectadas
Si ingresas un precio por metro, el aplicativo muestra una estimación comercial para la longitud seleccionada

## Ejecutar en Windows

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python app.py
```

Abre [el aplicativo local](http://127.0.0.1:5000) o [la documentación interactiva de la API](http://127.0.0.1:5000/docs)

Selecciona o arrastra cualquiera de los JSON de red de `dataset/` con prefijo `red_`, o pulsa **Usar red de ejemplo**
El mapa aparece al cargar el archivo y puedes ejecutar los algoritmos desde el panel lateral

## Consola y pruebas

```powershell
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
.\.venv\Scripts\python -m pytest -q
.\.venv\Scripts\python main.py dataset/red_osinergmin_ampliada.json --algoritmo prim
.\.venv\Scripts\python main.py tests/datos/red_pequena.json --algoritmo kruskal --precio-por-metro 3.98
```

Las pruebas cubren los dos datasets de referencia, redes pequeñas de distintos tamaños y validación de archivos y parámetros
Se usa Node.js para probar el dibujo del visor

## API

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/georreferenciado/{algoritmo}` | JSON de red en el cuerpo y `precio_por_metro` opcional en la consulta |
| GET | `/api/ejemplo` | Descarga la red de ejemplo |
| GET | `/health` | Comprueba que la API está disponible |

`algoritmo` admite `kruskal`, `prim` y `bfs`
Los errores de validación responden con código 422 y un mensaje en `error`

## Guías

- [Formato JSON, conversión y datos de referencia](docs/datos.md)
- [Publicación en Cloudflare Pages y Render](docs/despliegue-manual.md)
- [Informe académico](docs/informe_tb1.md)
