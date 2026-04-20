# Arándano Café Bar — Front

Panel web (React + Vite + TypeScript) para operar el local: catálogo, recetas, inventario, ventas, compras y finanzas. Habla con un **API HTTP** (`VITE_API_URL`); no conecta a PostgreSQL desde el navegador.

## Requisitos

- Node.js reciente
- Backend API en ejecución (misma máquina u host desplegado)

## Configuración

1. Copia el ejemplo de variables:

   ```bash
   cp .env.example .env.local
   ```

2. Edita **`.env.local`** (no se sube a git):

   | Variable        | Uso |
   |-----------------|-----|
   | `VITE_API_URL`  | URL base del API, **sin** barra final. Ej.: `http://localhost:3000` o la URL pública de tu backend en Railway. |
   | `DATABASE_URL`  | Solo si ejecutas **scripts o backend** en este repo que lean el mismo archivo. El front en el browser **no** usa esta variable. En Railway, suele ir en el servicio que corre Node y habla con Postgres. |

3. Formato típico de conexión PostgreSQL (referencia, **no pegues contraseñas en el repo**):

   ```text
   postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD
   ```

   En **Railway**: pestaña de la base de datos → *Connect* / *Variables* → copia la URL al entorno del servicio que debe conectar.

## Scripts

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción
npm run preview  # vista previa del build
```

## Autenticación

El front usa el token guardado por el API (`login` → `Authorization: Bearer …`). Sin sesión válida, algunas vistas pueden fallar al cargar datos.

## Módulos del menú

| Área      | Vistas |
|-----------|--------|
| Catálogo  | Productos, Recetas |
| Inventario | Inventario |
| Ventas    | Ventas |
| Compras   | Compras |
| Finanzas  | Costos, Gastos |
| Datos     | DB (tablas expuestas por el API, solo lectura) |

## Ventas — campos del API (`GET /sales`, `GET /sales/:id`)

El panel de ventas usa estos campos cuando existen:

| Campo | Uso en el front |
|--------|------------------|
| `total` | Total numérico en COP (prioridad para moneda) |
| `totalCOP` | Mismo total en string; respaldo si `total` no viene |
| `saleDate` | ISO 8601 (fecha y hora; editor y texto largo) |
| `saleDateOnly` | `YYYY-MM-DD` para la columna de fecha (sin desfase por zona) |
| `displayPerson` | Columna **Persona** y resumen del panel |
| `recordedByName` / `recordedByUserId` | Bloque **Registró** en el detalle |
| `lineCount` | Columna **Líneas** (antes que `_count`) |
| En cada línea: `lineTotal`, `lineTotalCOP`, `unitPrice` | Columna **Total línea** y precios |

La función `saleRowTotalNumeric()` en `src/api.ts` aplica esa prioridad (`total` → `totalCOP` → heurísticas legacy).

## Seguridad

- No subas **`.env.local`** ni URLs con usuario/contraseña a git ni a issues públicos.
- Si una credencial pudo filtrarse, **rótala** en Railway (nueva contraseña o nueva URL).
