# Correspondencia con la rúbrica TB1

Se revisaron el enunciado, la rúbrica TB1 y el caso **8: Diseño de redes eléctricas**.
El anexo Waze es otro caso: tráfico por hora y búsqueda de rutas urbanas no son
requisitos específicos del proyecto elegido. La lista del caso enumera técnicas
aplicables; no exige implementar todas.

## Evidencia para los criterios

| Criterio | Máximo | Evidencia preparada | Qué falta para la entrega académica |
|---|---:|---|---|
| Formato del informe | 4 | Base en `docs/informe_tb1.md` con las secciones TB1 | Elaborar el documento de entrega, identificar integrantes y verificar formato/paginación |
| Descripción del problema | 5 | Caso 8, objetivos y representación mediante grafo | Fundamentar el contexto real elegido con fuentes y ubicación concreta |
| Descripción del dataset | 5 | 1500 nodos, 2767 conexiones; coincidencia total con Dataset.pdf; estructura, fuentes y visualización | Explicar selección, transformación y vínculo entre IDs y registros primarios |
| Propuesta preliminar | 6 | Kruskal/UFDS, BFS, DFS y flujo máximo; motivos, complejidad y bibliografía | Integrar y citar correctamente estas referencias en el informe final del grupo |

La implementación aporta evidencia técnica. **No implica automáticamente una nota
20/20**: la rúbrica del Hito 1 califica principalmente el informe y la procedencia
real de los datos. Los puntos pendientes no deben presentarse como completados.

## Requisitos técnicos atendidos

- Backend y algoritmos implementados en Python, con FastAPI.
- GUI funcional para cargar, visualizar y volver a calcular.
- Mínimo de 1500 nodos validado en cada carga (500 por integrante para tres personas).
- Subgrafo visible con contador; cálculos sobre la red completa.
- JSON y CSV incluidos producen resultados equivalentes.
- MST con sus líneas, flujo máximo/corte y articulaciones.
- Pruebas reproducibles y explicación de complejidad.
- Funciones simples, módulos de menos de 100 líneas y SOLID documentado.

## Diferencias entre objetivos y garantías

El caso busca costo mínimo, soporte de demanda y robustez. Este prototipo entrega
indicadores separados para estudiarlos. No resuelve una optimización conjunta:
Kruskal no conserva redundancia y la capacidad supuesta no demuestra una demanda
real. Para esa validación se necesitan demandas, capacidades justificadas y un
análisis eléctrico adicional. Estas limitaciones están explícitas en la propuesta.

## Entregables según el enunciado

TB1: descripción del problema, descripción y visualización del dataset, propuesta
preliminar. Fecha indicada: **04/10/2026, 23:59**, exposición en semana 7.
El enunciado general establece un informe de 4 a 10 páginas y grupo de tres.

Hito 2: actualizar lo anterior y añadir propuesta detallada y diseño del aplicativo.
Hito 3: añadir pruebas, interpretación, conclusiones y referencias; entregar código,
dataset, informe y video según los nombres/formato del enunciado.

El grupo debe declarar el uso de IA y explicar el código en la sustentación.
La migración, modularización, revisión de validaciones, documentación y pruebas de
esta versión se prepararon con ayuda de Codex; cada integrante debe revisarlas.
