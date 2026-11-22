# Beat — visor único y auditoría del catálogo guardado

Fecha: 22 de noviembre de 2026.

## Resultado de la consulta de Supabase (lectura; sin modificaciones)
Proyecto original `quantdesk-ai`, organización Yanzsmartwood2025:

| Mercado almacenado | Registros |
| --- | ---: |
| Forex | 7 |
| Sintéticos | 46 |
| Cripto | 0 |
| Índices | 0 |
| Commodities / materias primas | 0 |
| **Total** | **53** |

**Activación para procesamiento:** 0 registros (`is_active = true`), 53 en pausa.

Los 46 sintéticos comprenden subcategorías ya registradas (p. ej., índices de volatilidad, saltos, rangos y cestas); se conservan sin cambios.

## Hallazgos en código existente
- `web/src/components/dashboard/Dashboard.tsx` consultaba correctamente `active_instruments` pero, cuando no había datos o ocurría un error, rellenaba la interfaz con nombres de ejemplo. Se eliminó ese fallback engañoso.
- `src/services/supabase_client.py` reconoce nominalmente `forex`, `synthetic_index`, `cryptocurrency`, `indices` y `commodities`. Su importador descarta entradas que no incluyan tanto un identificador como información de submercado. Esto es un **posible motivo** de omisiones, no una causa confirmada.
- El inventario histórico por sí solo no demuestra cobertura actual del proveedor, disponibilidad en tiempo real ni que falten/funcionen credenciales.

## Cambios de esta rama (interfaz exclusivamente)
- Selector móvil/escritorio con búsqueda **local** sobre los instrumentos de la categoría guardada; no genera consultas a proveedores de datos.
- Cinco pestañas con contadores exactos del catálogo local y título `Materias primas` para `Commodities`.
- **Una sola vista**: al escoger otro instrumento o categoría se limpian las velas, estado, historial y marcas visuales anteriores.
- Se descartan respuestas asíncronas antiguas y se cierra el canal de Realtime de Supabase del instrumento previo; no se abren canales para el elemento vacío.
- El gráfico se remonta por instrumento para evitar mezcla de velas y se limpia cuando no tiene datos.
- Velas: subida verde `#22c55e`, bajada roja `#ef4444`, incluidas sus mechas; resto del diseño monocromático.
- Botón `Cerrar vista`, sin escrituras de activación y sin cambios a la base de datos.

## Alcance y trabajo pendiente
Esta rama **NO importa nuevos instrumentos**, no ejecuta ni activa servicios financieros, y no simula que oro o criptomonedas ya estén en la base. Para evaluar por qué faltan se requiere una auditoría separada de cobertura, esquemas, validación y calidad del origen de los datos. La corrección no debe iniciar automáticamente tareas ni servicios de pago.

## Pruebas
```sh
cd web
node --test tests/beat-monochrome.test.cjs tests/beat-single-view.test.cjs
npm run lint
npm run build
```
Las 14 aserciones de los tests versionados pasaron en un intérprete JS aislado; una compilación nativa de Next.js y una revisión visual en móvil **siguen pendientes**. El proyecto Vercel conocido está configurado como Python y el estado READY de ese proyecto no prueba por sí solo la ruta Next.js.
