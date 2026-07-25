# Reporte de Diagnóstico - Estado Actual del Repositorio `quantdesk-ai`

Este es un inventario completo y honesto del estado real del repositorio, en respuesta a la solicitud de diagnóstico. Todo ha sido verificado inspeccionando el código fuente actual.

## 1. Estructura Completa del Repositorio

El árbol de directorios (excluyendo carpetas autogeneradas como `.git`, `__pycache__`, `venv`, etc.) es el siguiente:

```text
.
├── .env.example
├── .gitignore
├── README.md
├── backend-requirements.txt
├── db
│   └── schema.sql
├── src
│   ├── __init__.py
│   ├── agents
│   │   ├── __init__.py
│   │   ├── analyst.py
│   │   ├── base_llm.py
│   │   ├── portfolio.py
│   │   └── risk.py
│   ├── config.py
│   ├── main.py
│   └── services
│       ├── __init__.py
│       ├── deriv_client.py
│       └── supabase_client.py
├── tests
│   ├── __init__.py
│   └── test_imports.py
└── vercel.json
```

## 2. Estado de los Componentes Principales

*   **Agentes (Analista, Gestor de Riesgo, Portfolio Manager):** **Existen y están implementados**. En `src/agents/`, están creados `analyst.py`, `risk.py` y `portfolio.py`. Usan pydantic para forzar la salida estructurada y dependen de la clase en `base_llm.py`.
*   **Cliente de Deriv (WebSocket):** **Existe y está implementado**. En `src/services/deriv_client.py` se utiliza un cliente WebSocket síncrono. Contiene métodos para obtener las velas, las operaciones cerradas, el conteo de operaciones abiertas y enviar órdenes al mercado.
*   **Rotación de API Keys (Groq/Mistral):** **Existe y está implementado (de forma básica)**. El archivo `src/agents/base_llm.py` gestiona las llamadas (usando LiteLLM) y captura excepciones de Rate Limit para rotar entre las dos llaves enviadas. El agente analista y de riesgo usan las keys de Groq; el portfolio manager usa las de Mistral. No tiene fallback entre proveedores si todas las llaves se agotan (retorna `None`).
*   **Memoria en Supabase:** **Existe y está implementada**. El cliente `src/services/supabase_client.py` contiene lógica para guardar trazas de los agentes, resultados de las operaciones (wins/losses), y leer el estado para la memoria de rendimiento.
*   **Loop Continuo (24/7):** **Existe**. En `src/main.py` hay una función `main_loop()` con un ciclo `while True` que agrupa todo el pipeline de agentes para procesar cada par, con un `time.sleep` entre ciclos (controlado por la configuración `loop_interval_seconds`).

## 3. Configuración para Despliegue en Servidor Propio (Coolify/Docker)

**No existe nada de esto.**

*   ¿Existe un `Dockerfile`? **No.**
*   ¿Existe un `docker-compose.yml`? **No.**

El único archivo con temática de "despliegue" es `vercel.json`, que solo tiene la orden `"ignoreCommand": "exit 0"`, pensada para bloquear builds en la plataforma Vercel, pero el repo carece de instrucciones, contenedores o scripts definidos para levantarlo limpiamente en Coolify o en un VPS tradicional.

## 4. Esquema de Supabase

**Existe.** Se encuentra ubicado en `db/schema.sql`.
El archivo define:
*   Tabla `trading_memory` (para el track de operaciones ganadas/perdidas y su PnL).
*   Tabla `agent_traces` (para guardar el log de inputs/outputs/tokens por cada invocación a los LLMs).
*   Índices de base de datos asociados.

## 5. Variables de Entorno Requeridas

Analizando los archivos `.env.example` y la carga por Pydantic Settings (`src/config.py`), el proyecto espera explícitamente estas variables (si alguna no se define, se usará un valor por defecto que puede romper el sistema):

**Credenciales Deriv:**
*   `DERIV_APP_ID`
*   `DERIV_API_TOKEN`

**Credenciales LLM:**
*   `GROQ_API_KEY_1`
*   `GROQ_API_KEY_2`
*   `MISTRAL_API_KEY_1`
*   `MISTRAL_API_KEY_2`

**Credenciales Base de Datos:**
*   `SUPABASE_URL`
*   `SUPABASE_KEY`

**Configuración Funcional:**
*   `TRADING_ENABLED` *(boolean)*
*   `MAX_POSITION_SIZE` *(float)*
*   `MAX_DAILY_LOSS` *(float)*
*   `MAX_OPEN_TRADES` *(int)*
*   `LOOP_INTERVAL_SECONDS` *(int)*
*   `PAIRS` *(string delimitado por comas)*

## 6. Estado de los Tests

En la carpeta `tests/` sólo existe el archivo `test_imports.py`.
*   **¿Tienen sentido / son completos?** **No**. Este archivo solo realiza un `import` de los módulos principales del proyecto dentro de un `try-except` para verificar que el código base compile sin errores de sintaxis o dependencias faltantes.
*   **Faltantes críticos:** No existen pruebas unitarias reales, ni pruebas de integración, ni pruebas con mocks para comprobar la lógica de LLMs, ni para probar la conexión websocket o la base de datos.
*   **(Por instrucción, los tests no se ejecutaron en esta tarea, pero a simple vista su cobertura es virtualmente cero).**

## 7. Discrepancias / Observaciones Adicionales

1.  **Deuda técnica en comentarios y README:** El `README.md` tiene información desactualizada, menciona *"routing Groq/Gemini con fallback, y ejecución vía OANDA"*, lo cual es falso de acuerdo a los requerimientos actuales y código real (se usa Mistral y Deriv). En `src/main.py` (función `update_memory_from_closed_trades`), aún sobreviven comentarios haciendo referencia a **OANDA** (ej: *"OANDA doesn't store our setup_type..."* o *"Let's update oanda client method..."*).
2.  **Manejo de Errores de LLM:** El sistema captura `RateLimitError` para rotar llaves, pero si ocurre un rate limit en *todas* las llaves, la función retorna `None` silenciosamente y detiene el ciclo de ese instrumento en el log de consola, no hay fallback a otro proveedor de servicio. Esto concuerda con las instrucciones recibidas, pero representa un punto de falla si un proveedor se cae por completo.
3.  **Ejecución Síncrona vs Loop del WebSocket:** El proyecto está utilizando peticiones de tipo request/response sincrónicas sobre el WebSocket de Deriv en `_send_receive()` abriendo y cerrando la conexión WS para cada petición. Funciona (conforme a la instrucción síncrona), pero puede ser ineficiente o suceptible a bloqueos de rate limit de Deriv si el ciclo es muy corto.