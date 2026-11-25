# Beat: actualización visual monocromática

## Solicitud
La captura del 22 de noviembre de 2026 muestra la interfaz principal de QuantDesk AI con textos y degradados azules/morados, controles comprimidos horizontalmente en móvil y un cuadro flotante de diagnóstico. El nombre visible solicitado es **Beat**.

## Cambios de esta rama
- Encabezado real de la pantalla principal: **Beat** en letras blancas, sin degradados azules.
- Barra superior de categorías con estilo cristal negro/blanco; navegación horizontal si no caben categorías.
- Selector de instrumentos y etiqueta "solo lectura" separados y legibles en móvil; botones con objetivos táctiles amplios.
- Centro de visualización prioritario en móvil; fichas de agentes e historial abajo.
- Tarjetas de agentes, avisos, iconos y gráfico de datos históricos en escala gris.
- Pie, ventana de términos y metadatos del navegador muestran **Beat** como nombre de marca.
- El diagnóstico verde solo aparece en desarrollo; no se muestra en producción.
- El botón antiguo de activar procesamiento por Supabase se sustituye por un indicador de lectura: no hay actualización de `is_active` desde el navegador.

## Restricciones
- El repositorio y el identificador técnico de Supabase permanecen `quantdesk-ai`: cambiar esos identificadores requiere una migración independiente y podría romper enlaces.
- La rama no modifica el backend Python, las API, la base, los permisos ni la activación de ningún proceso.
- El panel es de carácter educativo; no hay conexión nueva a operaciones ni generación de señales.
- Los colores de información se distinguen con texto, iconos y formas, no solo con color.

## Validación
```sh
cd web
node --test tests/beat-monochrome.test.cjs
npm run lint
npm run build
```

Ejecutar el build en el frontend `web/`, no asumir que la raíz Python del proyecto Vercel compila Next.js. La aprobación visual en móvil/desktop es independiente de que Vercel marque READY.
