# Beat Lab — prototipo aislado de interfaz

Este borrador crea la ruta **/laboratorio** dentro del frontend Next.js.

## Diseño
- Encabezado: identidad de Beat Lab y estado de demostración.
- Barra superior: colecciones y acceso rápido para cambiar entre ocho series ficticias.
- Selector desplegable: búsqueda de la lista completa de muestras por nombre o código, también en móvil.
- Pantalla central: gráfico grande, cambio de intervalos, valor y variación de la muestra ficticia.
- Panel lateral: ficha del ejemplo y estado de seguridad.
- Franja inferior: tabla con las últimas observaciones ficticias.
- Diseño **Monochrome Space Glass** de negro/blanco/grises para escritorio y móvil; controles con etiquetas accesibles.
- Barra flotante estilo navegador **dentro de la aplicación**, con tres puntos decorativos, botón real para volver a `/`, restablecer estado y abrir la lista de series. No pretende modificar los controles de Chromium o del sistema operativo.
- Botones con cristal negro translúcido, borde blanco discreto y foco visible; objetivos táctiles de 44 px en la barra superior.
- Fondo negro con puntos estelares estáticos y reflejos blancos muy suaves. **Gráfico y paneles de datos opacos**, sin desenfoque para preservar la lectura.
- Estados de navegación en blanco/gris, sin azules, cian, rojos o verdes; si algún dato necesitara distinguirse en el futuro debe usar texto o iconos además de cualquier color.
- CSS encapsulado en `web/src/app/laboratorio/lab-glass.css`, con modo `forced-colors` y `prefers-reduced-motion`. Sin recursos externos, fuentes nuevas ni imágenes de pago.

## Referencias de diseño consultadas
- Apple Human Interface Guidelines, **Materials**, recomienda reservar Liquid Glass para controles/navegación, no cubrir la capa de contenido: https://developer.apple.com/design/human-interface-guidelines/materials
- Apple Human Interface Guidelines, **Color**, describe apariencia monocromática para barras y herramientas y uso limitado de acentos: https://developer.apple.com/design/human-interface-guidelines/color

Se toman esos principios generales, no se copia el diseño, marca o componentes privados de Apple.

## Alcance técnico y protección
- Datos inventados y generados determinísticamente en memoria: no se leen mercados ni servicios externos.
- No usa Supabase, conectores financieros, API tokens, WebSockets ni proveedores LLM.
- Seleccionar un elemento **no** actualiza registros ni activa procesamiento de fondo.
- No crea ni publica señales, pronósticos ni operaciones.
- Se incorpora en una ruta independiente; **no se modifica el Dashboard actual**.
- No se instala ni despliega automáticamente en Oracle, Coolify o Vercel.

## Validación
Con Node.js instalado, desde `web/`:

```sh
node --test tests/laboratorio-layout.test.cjs
# Verifica también navbar funcional, paleta monocromática y accesibilidad
npm run lint
npm run build
```

Las dos últimas verificaciones requieren instalar primero las dependencias revisadas del proyecto. Antes de una prueba visual en servidor, verificar la rama, ejecutar las pruebas y desplegar solamente una vista previa privada.

## Siguiente decisión de producto
La selección, presentación y procesamiento deben tener estados distintos. El catálogo visible nunca debe iniciar tareas externas. No asociar esta demostración con servicios de operaciones financieras.
