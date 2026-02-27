# GYM LOG — Contexto del proyecto

## Descripción
App de registro de entrenamientos personales. Migración de una app HTML/JS single-file a Next.js + Supabase + Vercel.

## Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Estilos:** Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL)
- **Despliegue:** Vercel (auto-deploy desde GitHub en rama master)

## Diseño visual
- Tema oscuro
- Fuentes: Bebas Neue (títulos/números) + DM Sans (cuerpo)
- Color accent: #c8f135 (verde lima)
- Fondo: #1a1a1a, superficie: #242424, borde: #333

## Estructura de la base de datos (Supabase)

```sql
create table entrenamientos (
  id uuid default gen_random_uuid() primary key,
  fecha date,
  ejercicio text,
  peso numeric,
  serie integer,
  repeticiones integer,
  fallo text,  -- "S" o "N"
  reserva integer,  -- RIR (Reps In Reserve), 0-10
  created_at timestamp default now()
);
```

## Lógica de negocio principal

### Formulario de registro
- Campos: fecha (date picker, default hoy), ejercicio (select + opción "otro"), peso (kg, nullable para ejercicios sin peso como fondos/flexiones), repeticiones, fallo muscular (toggle S/N), reserva RIR (oculto si fallo=S)
- Al seleccionar ejercicio, mostrar "Última vez" con los datos de la sesión anterior más reciente
- Al cambiar de ejercicio, resetear el toggle de fallo a "No"
- Las series se acumulan en un buffer local antes de guardar
- Al guardar, todas las series del buffer se persisten en Supabase
- La numeración de series es por ejercicio+fecha (no global)

### Lista de series pendientes (buffer)
- Muestra las series añadidas antes de guardar
- Cada serie muestra: número de serie (Bebas Neue, color accent), nombre del ejercicio (blanco, uppercase), datos (reps · peso · fallo · RIR)
- Botón borrar con icono SVG papelera rojo

### Historial de registros (modal)
Dos modos:
1. **Resumen** (default): agrupa por fecha, muestra "Hace X días" + lista de ejercicios del día
2. **Detalle**: lista completa serie a serie con buscador, papelera para borrar registros

### Cálculo de días
- Comparar componentes año/mes/día directamente (no aritmética con timestamps para evitar problemas de timezone)
- Si es hoy: no mostrar etiqueta de días
- Si es ayer: "Hace 1 día"
- Si es anterior: "Hace X días"

## Ejercicios predefinidos
Biceps, Cuádriceps, Dominadas, Espalda, Flexiones, Fly, Fondos, Hombro, Pecho, Plancha Glúteos, Triceps

## Datos existentes
Hay 51 registros históricos desde 5/2/26 hasta 27/2/26 en el archivo `entrenamientos_seed.json`.
Al migrar, convertir fechas de formato "d/m/yy" a formato ISO "YYYY-MM-DD" para PostgreSQL.

## Flujo de desarrollo
1. Desarrollar en local con `npm run dev`
2. Variables de entorno en `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
3. `git push` despliega automáticamente en Vercel
4. Las mismas variables están configuradas en Vercel para producción

## Archivos importantes
- `.env.local` — variables de entorno (no subir a git, ya en .gitignore)
- `entrenamientos_seed.json` — datos históricos para importar a Supabase

## Notas de implementación
- Usar Server Components de Next.js para lecturas, Client Components para el formulario interactivo
- El formulario principal es muy interactivo, usar "use client"
- Supabase client: crear en `lib/supabase.ts`
- No usar localStorage — todos los datos en Supabase
