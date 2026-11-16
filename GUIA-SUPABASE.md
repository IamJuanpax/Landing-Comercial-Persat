# Guía paso a paso: Crear y conectar Supabase (+ Deploy en Vercel)

Esta guía explica cómo crear la base de datos gratuita en **Supabase**, crear la tabla necesaria y conectar el proyecto **Next.js** tanto en tu computadora como en **Vercel**.

---

## 1. Crear el proyecto en Supabase

1. Ingresá a [https://supabase.com](https://supabase.com) e iniciá sesión con tu cuenta.
2. Hacé clic en **New project**.
3. Elegí tu organización (o creá una nueva), completá:
   - **Name**: por ejemplo `persat-portal-automatizaciones`.
   - **Database Password**: generá o escribí una contraseña segura y guardala.
   - **Region**: elegí la más cercana (por ejemplo `South America (São Paulo)`).
4. Hacé clic en **Create new project** y esperá 1–2 minutos a que termine de aprovisionarse.

---

## 2. Crear la tabla `consultas`

El repositorio ya incluye el script SQL listo en [`supabase/schema.sql`](./supabase/schema.sql).

1. En el menú lateral izquierdo de tu proyecto en Supabase, abrí **SQL Editor**.
2. Hacé clic en **New query**.
3. Abrí el archivo [`supabase/schema.sql`](./supabase/schema.sql), copiá **todo** su contenido y pegalo en el editor SQL de Supabase.
4. Hacé clic en **Run** (o presioná `Ctrl + Enter`).
5. Deberías ver el mensaje `Success. No rows returned`.
6. Para confirmar que quedó creada, podés ir a **Table Editor** en el menú izquierdo y verificar que aparece la tabla **`consultas`** con estas columnas:
   - `id` (`text`, primary key)
   - `vertical` (`text`: `'tecnicos' | 'vendedores' | 'logistica'`)
   - `pregunta` (`text`)
   - `tipo_deal` (`text`)
   - `descripcion` (`text`)
   - `deal` (`text`)
   - `autor` (`text`)
   - `estado` (`text`: `'pendiente' | 'analisis' | 'resuelta' | 'descartada'`)
   - `creado_en` (`timestamptz`)
   - `editado_en` (`timestamptz`)

---

## 3. Obtener las credenciales de conexión

1. En el menú izquierdo de Supabase, entrá a **Project Settings** (ícono de engranaje abajo a la izquierda).
2. Entrá a **Data API** (o **API**) y copiá:
   - **Project URL** (ejemplo: `https://abcdefghijklm.supabase.co`)
3. Entrá a **API Keys** y copiá:
   - La clave pública **anon / publishable** (empieza con `eyJ...` o `sb_publishable_...`).
   - *(Opcional)* Si querés mayor seguridad en producción, también podés copiar la clave privada **service_role / secret** para usarla solo del lado del servidor (`SUPABASE_SERVICE_ROLE_KEY`). Nunca compartas ni expongas esta clave en el navegador.

---

## 4. Conectar el proyecto en tu computadora (Local)

1. En la raíz del proyecto, creá un archivo llamado `.env.local` (podés copiar `.env.example` y renombrarlo a `.env.local`).
2. Completalo con tus credenciales reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

*(Opcional, si querés usar la clave privada del servidor en las API routes)*:

```env
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-aqui
```

> **Importante:** El archivo `.env.local` está ignorado en `.gitignore` para que nunca se suba a GitHub por accidente.

3. Instalá dependencias y levantá el servidor de desarrollo:

```bash
npm install
npm run dev
```

4. Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.
   - En la esquina inferior del formulario vas a ver el punto verde: **"Se guarda automáticamente en Supabase."**
   - Creá una consulta de prueba y verificá en Supabase (**Table Editor -> consultas**) que aparece guardada al instante.

---

## 5. Subir a Vercel y conectar la base de datos en producción

1. Subí el repositorio a GitHub (recordá no incluir `.env.local`).
2. Entrá a [https://vercel.com](https://vercel.com), hacé clic en **Add New... -> Project** e importá tu repositorio.
3. Antes de hacer clic en **Deploy**, desplegá la sección **Environment Variables** y agregá las mismas variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave anon
   - *(Opcional)* `SUPABASE_SERVICE_ROLE_KEY` = tu clave service_role
4. Hacé clic en **Deploy**.
5. Cuando termine el build, tu portal ya estará online y conectado a la misma base de datos de Supabase.

---

## 6. Migrar consultas previas desde el HTML anterior (opcional)

Si ya habías cargado consultas en `portal-automatizaciones-comercial.html`:

1. Abrí el archivo HTML original en tu navegador y tocá **Exportar** para descargar el archivo `.json`.
2. Abrí tu nueva app en Next.js (local o en Vercel) y tocá **Importar**.
3. Seleccioná ese archivo `.json`. Todas las consultas se guardarán automáticamente en Supabase manteniendo su fecha, vertical, autor y estado originales.
