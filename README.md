# quantdesk-ai

Plataforma de trading forex asistida por IA — pipeline multi-agente (análisis técnico, riesgo, decisión) con memoria de desempeño en Supabase, uso de LLMs con Groq y Mistral (incluyendo rotación de claves para evitar límites de tasa), y ejecución vía Deriv. Modo demo/practice.

## Características

- **Agentes de IA:** Analista técnico, Gestor de riesgos y Gestor de portafolio para toma de decisiones.
- **LLMs:** Utiliza Groq para análisis y riesgo, y Mistral para la toma de decisiones de portafolio, con un sistema de rotación manual de claves (ej. 2 claves por proveedor).
- **Ejecución de Trading:** Integrado con la API de Deriv vía WebSocket para datos de mercado en múltiples temporalidades (D1, H4, H1) y ejecución.
- **Memoria de Desempeño:** Almacena el historial de trades en Supabase para análisis de desempeño pasado.
- **Funcionamiento 24/7:** Ejecución en un bucle continuo diseñado para correr ininterrumpidamente en contenedores Docker.

## Cómo desplegar

Este proyecto está diseñado para desplegarse de manera continua en un servidor propio administrado con **Coolify** (self-hosted).

### Pasos para desplegar en Coolify

1. **Crear el recurso:** En el panel de control de Coolify, crea un nuevo recurso seleccionando "Docker Compose" o "Git Repository".
2. **Conectar el repositorio:** Selecciona la integración con GitHub/GitLab para conectar este repositorio.
3. **Variables de entorno:** En la pestaña "Environment Variables" o en la interfaz de configuración del recurso en Coolify, debes agregar todas las variables necesarias. Puedes guiarte por el archivo `.env.example`, que incluye:

   **Credenciales Deriv:**
   - `DERIV_APP_ID`
   - `DERIV_API_TOKEN`

   **Proveedores LLM:**
   - `GROQ_API_KEY_1`
   - `GROQ_API_KEY_2`
   - `MISTRAL_API_KEY_1`
   - `MISTRAL_API_KEY_2`

   **Credenciales Supabase:**
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

   **Parámetros de Trading (Opcionales / Ajustables):**
   - `TRADING_ENABLED` (ej. `false` o `true`)
   - `MAX_POSITION_SIZE` (ej. `1000`)
   - `MAX_DAILY_LOSS` (ej. `50.0`)
   - `MAX_OPEN_TRADES` (ej. `3`)
   - `LOOP_INTERVAL_SECONDS` (ej. `3600`)
   - `PAIRS` (ej. `EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD`)

4. **Desplegar:** Inicia el despliegue. Coolify leerá el archivo `docker-compose.yml` y construirá la imagen automáticamente basada en el `Dockerfile` configurado.

> **¡IMPORTANTE!:** Las variables reales se deben cargar **únicamente** a través de la interfaz de configuración segura de Coolify o usando un archivo `.env` localmente (el cual está en el `.gitignore`). **NUNCA** subas tus credenciales reales (API Keys, Tokens) directamente a los archivos de código o al repositorio de control de versiones.

### Ejecución Local con Docker Compose

Si deseas ejecutar el proyecto localmente usando Docker Compose:
1. Renombra `.env.example` a `.env` (o crea un archivo `.env`).
2. Rellena los datos con tus credenciales.
3. Ejecuta `docker-compose up --build`. (Recuerda que `docker-compose.yml` tomará los valores del sistema o de tu entorno local; si usas un archivo `.env`, puedes especificarlo o usarlo exportando las variables).
