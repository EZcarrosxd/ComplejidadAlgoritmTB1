# Verificación de la migración

Fecha: 04/10/2026. Rama de trabajo: `desarrollo`.
Entorno: Windows, Python 3.14, versiones declaradas en `requirements*.txt`.

## Pruebas automatizadas

Comando: `.venv/Scripts/python -m pytest -q`.
Resultado: **56 pruebas aprobadas**, incluida la preparación para servidores separados.
Starlette emite una advertencia de deprecación de su integración con `httpx`;
no es un fallo de la aplicación ni de las pruebas.

Se comprueban rutas, carga JSON/CSV, mínimo de nodos, números inválidos, IDs,
archivos mal formados, límite de tamaño, extremos manuales y errores HTTP.
Un fallo de carga conserva el último resultado válido.

Los casos algorítmicos incluyen un triángulo de solución conocida, una cadena de
1500 nodos, componentes desconectadas, nodos aislados, líneas paralelas, capacidad
cero y flujo en sentido inverso. Un lector de prueba verifica la sustitución del
contrato `LectorDataset`.

## Dataset completo

| Salida | Resultado |
|---|---|
| Nodos / líneas | 1500 / 2767 |
| Componentes | 1 |
| Líneas del MST | 1499 |
| Costo mínimo | S/ 132156.46 |
| Articulaciones | 14 |
| Flujo automático N-1408 → N-1426 | 20 A |
| Flujo manual N-1 → N-2 | 80 A |

La capacidad predeterminada es un supuesto de 20 A por línea.
Las 2767 ternas del JSON coinciden exactamente con `Dataset.pdf`.
La carga CSV produce los mismos resultados que el JSON, salvo el tiempo medido.

## Interfaz en navegador

Comprobado con agent-browser contra Uvicorn en el puerto 5000:

- Carga de la página, CSS y módulos JavaScript sin errores de ejecución.
- Carga JSON y visualización del subgrafo de 100 nodos.
- Recálculo manual N-1 → N-2 y visualización de 80 A.
- Rechazo de origen igual a destino con un mensaje visible.
- Reinicio y nueva carga CSV.
- Vista móvil de 390 px, sin desbordamiento horizontal y con el grafo renderizado.
- Frontend estático en el puerto 8000 y backend en 5010: carga de 1500 nodos y
  recálculo N-1 → N-2 de 80 A mediante CORS, sin renderizado Python del HTML.

Las pruebas adicionales verifican `/health`, fragmentos HTML estáticos, cabeceras
CORS en respuestas correctas y errores, y preflight de orígenes permitidos/rechazados.

También se comprobó sintaxis JavaScript con `node --check`, integridad de dependencias
con `pip check` y ejecución desde consola con origen y destino explícitos.

Estas pruebas validan el software y su modelo de grafos. No acreditan capacidades
eléctricas físicas ni sustituyen el informe académico.
