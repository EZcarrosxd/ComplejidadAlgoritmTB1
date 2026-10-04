# Arquitectura para estudiantes

El recorrido de una petición es:

`pantalla → ruta FastAPI → cargador → grafo → analizador → respuesta → pantalla`.

## Responsabilidades

| Carpeta/archivo | Responsabilidad |
|---|---|
| `app.py` | Iniciar el servidor |
| `backend/factory.py` | Conectar las piezas de la aplicación |
| `backend/api/` | Recibir peticiones HTTP, servir la página y devolver resultados |
| `backend/data/` | Leer JSON/CSV y validar su estructura |
| `backend/domain/network.py` | Representar el grafo con listas de adyacencia |
| `backend/algorithms/` | Un algoritmo o estructura auxiliar por archivo |
| `backend/services/analysis.py` | Ejecutar el caso de uso de análisis |
| `backend/services/terminals.py` | Elegir y validar extremos del flujo |
| `backend/services/visualization.py` | Elegir y preparar el subgrafo visible |
| `backend/services/fallas.py` | Medir cuántos nodos aísla cada nodo crítico |
| `backend/schemas/` | Declarar la estructura de las respuestas de FastAPI |
| `frontend/templates/` | Fragmentos HTML por sección de la pantalla |
| `frontend/static/js/` | Módulos por comportamiento de la interfaz |
| `frontend/static/css/` | Estilos por componente |
| `tests/` | Casos pequeños verificables y pruebas del dataset completo |

Cada archivo de código se mantiene por debajo de 100 líneas. Se usan funciones,
listas, diccionarios, conjuntos, colas y clases pequeñas. No hay un framework
adicional de arquitectura ni herencia innecesaria.

## SOLID aplicado

- **S, responsabilidad única:** leer CSV no calcula flujo ni conoce HTTP.
- **O, abierto a extensión:** otro formato implementa `leer(texto)` y se registra
  en `factory.py`. El cargador y los algoritmos permanecen iguales.
- **L, sustitución:** `LectorJson` y `LectorCsv` cumplen el mismo contrato de
  devolver un diccionario de datos crudos o un error de validación.
- **I, interfaces pequeñas:** `LectorDataset` tiene solamente `leer`.
- **D, inversión de dependencias:** el cargador recibe lectores compatibles con
  ese contrato; FastAPI inyecta cargador y analizador con `Depends`.

`Protocol` describe lo que un lector debe hacer. No obliga a heredar de una clase.
Los algoritmos son funciones independientes: SOLID no exige convertir todo en clases.

## Decisiones simples

En local, la API y el panel pueden servirse en el mismo puerto.
El frontend también funciona en un alojamiento estático: `bootstrap.js` carga los
fragmentos HTML antes de iniciar los eventos. No requiere Python ni compilación.
`config.js` contiene la dirección del backend; vacía significa el mismo origen.
El grafo se dibuja en un `canvas`; `layout.js` solo acomoda los puntos en pantalla
y `state.js` guarda el estado de la interfaz. Los resultados siempre vienen del backend.
Al separar servidores, `ALLOWED_ORIGINS` permite sus dominios exactos mediante CORS.
Los archivos subidos se leen sin guardarlos con el nombre enviado por el usuario.
El límite leído por la ruta es 10 MiB; el parser multipart puede usar temporales.

El último análisis se guarda en `app.state`, separado entre instancias de la app.
Los GET tradicionales muestran el último análisis terminado del proceso, compartido
entre visitantes. Es una demostración local con **un solo worker**, sin usuarios ni
persistencia. Cada POST devuelve su propio resultado; un error no borra el anterior.
Al reiniciar se pierde el resultado. Para varios usuarios se necesitarían IDs y almacenamiento.

Las rutas de cálculo son síncronas: FastAPI las ejecuta fuera del bucle asíncrono.
Esto no acelera algoritmos de CPU ni sustituye una cola de trabajos de producción.

## Orden sugerido de lectura

1. `network.py`: nodos, líneas y vecinos.
2. `bfs.py`: cola y recorrido por niveles.
3. `union_find.py` y `kruskal.py`: evitar ciclos y minimizar costos.
4. `articulacion.py`: DFS con pila y valores de descubrimiento.
5. `flujo.py` y `corte.py`: caminos aumentantes y capacidad residual.
6. `analysis.py`, `upload.py` y `factory.py`: conectar las piezas.

No hay llamadas HTTP dentro de los algoritmos ni código de algoritmos en JavaScript.
