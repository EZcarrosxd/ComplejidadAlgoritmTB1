# 📋 Documentación del Proyecto y Rúbrica de Evaluación

**Curso:** 1ACC0184 - Complejidad Algorítmica  
**Ciclo:** 2026-20  
**Evaluación:** Trabajo Parcial (TB1) / Final (TB2)

Este documento consolida el caso de estudio asignado al grupo y transcribe textualmente los requisitos y la rúbrica oficial del curso para asegurar el cumplimiento de todos los criterios de calificación.

---

## 🏗️ 1. Proyecto Asignado: Caso de Estudio 8

Según el documento de referencia de casos de estudio, el proyecto a desarrollar es el siguiente:

*   **Número de Caso:** 8
*   **Tema:** Diseño de redes eléctricas
*   **Fuente / Contexto:** IEEE
*   **Objetivos del Sistema:** Diseñar una red eléctrica que:
    *   Minimice el costo de cableado.
    *   Soporte la demanda energética.
    *   Sea robusta ante fallos.
*   **Técnicas Algorítmicas Sugeridas / Permitidas:**
    *   Fuerza Bruta: evaluar configuraciones posibles
    *   Backtracking: poda de configuraciones inválidas
    *   Divide y vencerás: dividir regiones geográficas
    *   Grafos: modelar nodos eléctricos
    *   BFS/DFS: análisis de conectividad
    *   Ordenamiento topológico: distribución de energía
    *   SCC: detectar redundancias
    *   UFDS: verificar conexiones
    *   MST: algoritmo principal (Prim/Kruskal)
    *   Flujo máximo: distribución de energía
    *   Voraces: selección de conexiones
    *   Programación dinámica: optimización de costos
    *   DP en grafos: rutas eficientes

---

## 📊 2. Rúbrica Detallada - Trabajo Parcial (Hito #1)

*A continuación, se transcribe exactamente la rúbrica del Trabajo Parcial (Hito #1) para el Trabajo de Investigación - Complejidad Algorítmica.*

| Criterios | Sobresaliente | Aceptable | En proceso | Deficiente |
| :--- | :--- | :--- | :--- | :--- |
| **Formato del informe**<br>*(Máx: 4 Puntos)* | **(4 Puntos)**<br>Usa la estructura establecida para el desarrollo del informe correctamente. | **(3 Puntos)**<br>Usa la estructura establecida para el desarrollo del informe pero con pocas deficiencias. | **(2 Puntos)**<br>Usa la estructura establecida para el desarrollo del informe pero con múltiples deficiencias. | **(0 Puntos)**<br>No usa la estructura establecida para el desarrollo del informe. |
| **I. Descripción del problema**<br>*(Máx: 5 Puntos)* | **(5 Puntos)**<br>Selecciona un "nuevo" problema de la vida real y propone su representación a partir de datos reales. Presenta el contexto del trabajo. Describe el problema. Plantea claramente el /los objetivo(s) a lograr de forma completa. | **(3 Puntos)**<br>Selecciona el problema de transporte propuesto y propone su representación a partir de datos reales. Presenta el contexto del trabajo. Describe el problema. Plantea claramente algunos de los objetivo(s) a lograr. | **(2 Puntos)**<br>Presenta el contexto del trabajo. Describe el problema pero no plantea o precisa claramente el /los objetivo(s) a lograr. | **(0 Puntos)**<br>No desarrolla la descripción del problema ni plantea claramente el /los objetivo(s) a lograr. |
| **II. Descripción del conjunto de datos (dataset)**<br>*(Máx: 5 Puntos)* | **(5 Puntos)**<br>Analiza y describe asertivamente la estructura del conjunto de datos que utilizara asi como su origen. | **(4 Puntos)**<br>Analiza y describe asertivamente la estructura del conjunto de datos que utilizara pero no explica su origen o como los obtuvo. | **(2 Puntos)**<br>Analiza y describe con multiples deficiencias la estructura del conjunto de datos que utilizara o no explica su origen. | **(0 Puntos)**<br>No describe el conjunto de datos que utilizará. |
| **III. Propuesta (preliminar)**<br>*(Máx: 6 Puntos)* | **(6 Puntos)**<br>Menciona que técnica o metodología utilizará para dar solución al problema planteado especificando por que la elige y respalda su eleccion con alguna referencia bibliografica y/o estudio anterior. | **(4 Puntos)**<br>Menciona que técnica o metodología utilizará para dar solución al problema planteado y especifica el por que la elige. | **(2 Puntos)**<br>Menciona que técnica o metodología utilizará para dar solución al problema planteado pero no especifica el por que la elige. | **(0 Puntos)**<br>No especifica que técnica o metodología utilizará para dar solución al problema planteado. |

---

## 📅 3. Estructura de Entregables (Hitos)

El trabajo se ha dividido en 3 hitos. El proyecto debe ser desarrollado en **grupos de 3**.

### PRIMER HITO (TB1 - TRABAJO PARCIAL)
*   **Puntaje asignado:** 0 a 20 puntos
*   **Fecha de entrega en Aula Virtual:** Semana 6 (máximo Domingo 04/10/2026 23:59h)
*   **Exposición y Sustentación:** Semana 07
*   **Nombre del archivo:** `TB1_1ACC0184_2026-20_CodigoAlum_ApellidoAlum`
*   **Contenido del Informe:**
    *   **Descripción del problema:** Redactar la descripción y fundamentación del problema citando fuentes. 
        *   *Tener en cuenta:* El problema deberá representar una situación de la vida real susceptible a ser representada por sus datos a través de un grafo. Este problema representado en un grafo deberá poder ser recorrido a través de una o más técnicas de búsqueda con el propósito de encontrar posibles soluciones (o la mejor).
    *   **Descripción y visualización del conjunto de datos (dataset):** Redactar las características y origen de los datos motivo de análisis.
        *   *Tener en cuenta:* El número de nodos identificados y a representar mediante un grafo, **no deberá ser menor a 1500 en total (500 por integrante como mínimo)**. Mostrar mediante un grafo completo y/o subgrafos los datos recolectados.
    *   **Propuesta:** Redactar de forma preliminar, el objetivo de la propuesta, técnica y metodología a utilizar.

### SEGUNDO HITO
*   **Puntaje asignado:** 0 a 5 puntos
*   **Fecha de entrega en Aula Virtual:** Semana 13 (máximo Domingo 22/11/2026 23:59h)
*   **Nombre del archivo:** `TB2_1ACC0184_2026-20_CodigoAlum_ApellidoAlum`
*   **Contenido del Informe:** 
    *   Descripción del problema (actualizado).
    *   Descripción del conjunto de datos (dataset) (actualizado).
    *   Propuesta detallada (técnica que se decidió finalmente utilizar).
    *   **Diseño del aplicativo:** Describir los procesos del diseño del aplicativo considerando las etapas de la ingeniería de software o considerando el análisis de algoritmos según sea el caso.

### TERCER HITO (TB2 - TRABAJO FINAL)
*   **Puntaje asignado:** 0 a 15 puntos
*   **Fecha de entrega en Blackboard:** Semana 14 (máximo Domingo 29/11/2026 23:59h)
*   **Exposición:** Durante la semana 15
*   **Nombre del archivo:** `TrabajoFinal_1ACC0184_2026-20_CodigoAlum_ApellidoAlum.zip`
*   **Contenido del ZIP:**
    *   Sub carpeta de "Código fuente".
    *   Sub carpeta Dataset.
    *   Link de video grabado de la exposición 12 minutos (cada uno 4 minutos) en un archivo de texto.
    *   `TrabajoFinal_Informe_Codigo_Apellido.docx`
*   **Contenido Final del Informe:** Descripción del problema, Dataset, Propuesta, Diseño del aplicativo, **Validación de resultados y pruebas** (Entradas, salidas, interpretación), **Conclusiones** (técnica usada y trabajo a futuro) y **Referencias bibliográficas** (4 a 10 páginas máximo).

---

## ⚙️ 4. Reglas del Curso y Exposición

### Lenguaje de Programación
*   El desarrollo de la aplicación debe estar implementado en **Python** (salvo restricción sustentada).
*   La interfaz gráfica (GUI) puede implementarse en cualquier lenguaje (como en este proyecto: HTML/JS + Flask).
*   **Es importante demostrar la aplicación en la interfaz gráfica (GUI).**

### Exposición Final (Semana 15)
*   Vestimenta formal.
*   Una diapositiva máximo 15 páginas resaltando (problema y fundamento, estado de arte, propuesta, desarrollo del aplicativo si fuera el caso, resultados y discusión).
*   10 minutos de exposición por cada grupo.
*   Se realizarán preguntas a los integrantes del grupo acerca del trabajo y deberán detallar el contenido.

### Declaración de IA y Penalizaciones (Obligatorio)
*   **Declaración de IA:** Durante la exposición, el grupo **debe declarar si ha utilizado herramientas de IA** (Artificial Intelligence) y especificar en qué parte del trabajo lo ha utilizado. Si el docente detecta el uso no declarado, tiene la potestad de penalizar.