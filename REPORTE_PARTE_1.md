## Parte 1 — Reporte de verificación

Confirmo con evidencia del código actual que los 3 bugs diagnosticados en la sesión anterior fueron corregidos correctamente:

1. **¿El request a Deriv usa "active_symbols": "full" ahora?**
   **Sí.** En `src/services/deriv_client.py`, línea 113, dentro del método `get_active_synthetics`, se observa claramente que el request especifica `"active_symbols": "full"`:
   ```python
   def get_active_synthetics(self) -> List[Dict[str, Any]]:
       """Obtiene la lista completa de índices sintéticos de Deriv."""
       req = {
           "active_symbols": "full",
           "product_type": "basic"
       }
   ```
   Esto asegura que Deriv devuelva la información completa de los índices sintéticos y se puedan sincronizar a la base de datos sin errores.

2. **¿La columna category en active_instruments quedó ampliada?**
   **Sí.** Revisando `db/schema.sql`, la creación de la tabla `active_instruments` asigna el tamaño `VARCHAR(50)` a la columna `category` (previamente reportada como muy corta):
   ```sql
   CREATE TABLE IF NOT EXISTS active_instruments (
       instrument VARCHAR(20) PRIMARY KEY,
       category VARCHAR(50) NOT NULL,
       is_active BOOLEAN NOT NULL DEFAULT false,
       activated_at TIMESTAMP WITH TIME ZONE
   );
   ```

3. **¿El selector de temporalidad usa la lista fija de 7, sin consultar dinámicamente market_candles?**
   **Sí.** En `web/src/components/dashboard/Dashboard.tsx` (líneas 134-142), el selector usa directamente una constante `TIMEFRAMES_DISPLAY` (lista fija de 7 timeframes). Ya no realiza consultas dinámicas para llenar el dropdown:
   ```tsx
        // 1. We ALWAYS support these exactly 7 timeframes as configured by backend
        const availableTimeframes = [...TIMEFRAMES_DISPLAY];
        setTimeframes(availableTimeframes);
   ```
