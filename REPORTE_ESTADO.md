# Reporte de Estado Actual - quantdesk-ai

De acuerdo a la revisión exhaustiva del código actual en el repositorio, presento el siguiente diagnóstico respondiendo a las preguntas planteadas:

### 1. Instrumentos sintéticos activos

Los instrumentos sintéticos que quedaron activos y configurados para el loop principal son **exactamente 4**. La lista exacta, incluyendo sus nombres o símbolos crudos, se encuentra definida en `src/config.py`:
*   `R_75`
*   `R_100`
*   `BOOM1000`
*   `CRASH1000`

Se procesan bajo la categoría "Sintéticos" en la configuración y se envían a Deriv sin ningún prefijo de "frx", ya que la lógica en `src/services/deriv_client.py` los filtra explícitamente para mantenerlos así (ej. `if instrument in ["R_75", "R_100", "BOOM1000", "CRASH1000"]: return instrument`).

### 2. Temporalidades guardadas en `market_candles`

El backend está solicitando y guardando datos de velas (`candles`) para 3 temporalidades distintas por cada instrumento. La lista exacta de valores que se envían y almacenan en la tabla de la base de datos `market_candles` hoy es:
*   `D1` (Diario)
*   `H4` (4 horas)
*   `H1` (1 hora)

Esto se comprueba en el archivo `src/main.py` mediante la invocación: `candles = deriv.get_multi_timeframe_candles(instrument, timeframes=["D1", "H4", "H1"], count=20)`.

### 3. El bug de validación del Analista Técnico

**Sí, el problema está latente.**
Si bien no he ejecutado ciclos que disparen el error durante esta inspección, revisando la definición de la clase `TechAnalystOutput` en `src/agents/analyst.py`, observo que todos sus campos son obligatorios:
*   `trend: str`
*   `key_support: float`
*   `key_resistance: float`
*   `setup_type: str`
*   `confidence: float`
*   `reasoning: str`

**La causa:** Ninguno de estos campos (incluyendo `trend` y `key_support`) tiene un valor por defecto o está declarado como opcional (ej. `Optional[str]`). Cuando el LLM (Groq) responde con un JSON que omite alguno de estos campos —lo cual puede pasar si el modelo no detecta claramente una tendencia o soporte— Pydantic rechaza el objeto arrojando un error de validación (ValidationError). Ese error de validación es capturado en silencio por el bloque `except Exception as e:` en `src/agents/base_llm.py`, lo que hace que la función devuelva `None` y el agente aborte el ciclo para ese instrumento sin un fallo general, pero impidiendo el análisis.

### 4. Estado general de las tareas de la UI / Frontend

*   **Sintéticos en la UI:** **Completado.** La UI permite seleccionar la categoría "Sintéticos" (junto con "Forex") e incluye un menú desplegable funcional que muestra los 4 instrumentos definidos.
*   **Scroll de consola (Consola de Agentes):** **Completado.** El componente `ReasoningFeed.tsx` tiene implementado `flex-1 overflow-y-auto` en el contenedor de los rastros (traces), y el layout responsivo (`Dashboard.tsx`) asegura que en desktop su tamaño esté delimitado al espacio disponible (o tenga un min-height en móvil), de forma que realiza un scroll vertical interno sin desbordar toda la página.
*   **Categorías deslizables en móvil (Swipeable Tabs):** **Completado.** En `Dashboard.tsx`, el selector de categorías horizontales está envuelto en un contenedor con las clases `flex-nowrap overflow-x-auto ... [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`. Esto efectivamente oculta las barras de desplazamiento por defecto, logrando el efecto de tabs deslizables tipo aplicación móvil nativa. Además, el selector de instrumento usa un menú que, en pantallas móviles (`md:hidden`), funciona como un "bottom sheet" (menú anclado abajo) muy moderno y funcional.
