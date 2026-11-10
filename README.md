# Observatorio La Libertad Produce

Plataforma de la Gerencia Regional de la Producción del Gobierno Regional La Libertad para publicar los indicadores de sus subgerencias, el seguimiento de los documentos de gestión regional y el directorio del ecosistema de innovación y emprendimiento. Iniciativa a cargo de la UTF-CTI.

## Qué incluye

**Sitio público**

- Portada con indicadores destacados y acceso por área.
- Un menú por subgerencia (MYPE, Industria, Pesca, CTI; se agregan más desde la base de datos).
- Página de cada indicador: último dato, variación interanual, gráfico de evolución, desagregación por sector o cadena, ficha técnica, tabla de datos y descarga CSV.
- Documentos de gestión (PRCTI, PDRC, PRCP, PEI, POI) con ficha técnica y hasta 10 metas prioritarias cada uno.
- Ecosistema en cuatro categorías, con mapa, filtros, formulario público de registro y enlaces a los observatorios complementarios (Asociación Pataz y CERPLAN).
- Datos abiertos: descarga de valores, fichas, metas y actores en CSV.

**Panel de administración** (`/panel`)

| Rol | Puede |
|---|---|
| Responsable de carga | Descargar la plantilla de su área, subir datos y ver el estado de sus cargas. |
| Revisor (UTF-CTI) | Todo lo anterior para todas las áreas; aprobar o devolver cargas; editar indicadores, documentos, metas y actores. |
| Administrador | Todo lo anterior; crear usuarios, restablecer claves y consultar el historial. |

**Flujo de datos**

1. El responsable descarga la plantilla estándar (`.xlsx`), prellenada con el siguiente periodo de cada indicador de su área.
2. La sube al panel. El sistema valida códigos, periodos, sectores y valores, y rechaza el archivo indicando la fila y la columna de cada error.
3. Si el archivo es válido, queda pendiente con alertas de consistencia (variaciones atípicas, totales que no cuadran, valores que reemplazan datos publicados).
4. La UTF-CTI la aprueba (se publica al instante) o la devuelve con observaciones. Todo queda en el historial.

## Tecnología

Next.js 15 (TypeScript) · PostgreSQL (Supabase) · ExcelJS · Apache ECharts · Leaflet con OpenStreetMap. Sesiones propias con claves cifradas (bcrypt), bloqueo tras 5 intentos fallidos y cambio obligatorio de la clave temporal.

## Puesta en marcha local

Requisitos: Node.js 20 o superior y una base PostgreSQL.

```bash
cp .env.example .env          # y complete DATABASE_URL
npm install
npm run db:migrate            # crea las tablas
npm run db:seed               # catálogos, datos de ejemplo y 5 usuarios (imprime las claves temporales)
npm run dev                   # http://localhost:3000
```

`npm run db:seed -- --reset` borra todo y vuelve a cargar los datos de ejemplo.
`npm run db:usuario -- correo@dominio "Nombre" cargador mype` crea un usuario desde la terminal.

## Despliegue en Supabase y Vercel (planes gratuitos)

1. **Supabase**: cree un proyecto (región São Paulo, la más cercana). En *Project Settings > Database > Connection string*, copie la cadena del **Transaction pooler** (puerto 6543).
2. Desde su computadora, con esa cadena en `.env`, ejecute `npm run db:migrate` y `npm run db:seed`. Guarde las claves temporales que imprime.
3. **Vercel**: importe este repositorio. En *Environment Variables* agregue `DATABASE_URL` (la misma cadena) y `NEXT_PUBLIC_MODO_DEMO=true` mientras se usen datos de ejemplo.
4. Despliegue. Cada cambio en la rama `main` se publica automáticamente.
5. Para pasar a datos oficiales: desmarque «Datos referenciales» en cada indicador, meta y actor, o reinicie la base sin datos de ejemplo, y cambie `NEXT_PUBLIC_MODO_DEMO` a `false`.

## Estructura

```
app/                 páginas (sitio público y /panel)
app/panel/acciones.ts  acciones del servidor (carga, revisión, usuarios, contenidos)
components/          encabezado, tarjetas, gráficos, mapa
lib/                 base de datos, sesiones, plantilla Excel y validación, consultas
db/schema.sql        esquema de la base de datos
scripts/             migración, datos de ejemplo y alta de usuarios
```

Los datos marcados como «referenciales» son de ejemplo y no corresponden a información oficial.
