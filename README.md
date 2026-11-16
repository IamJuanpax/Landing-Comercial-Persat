# Portal de Automatizaciones · Comercial Persat (Next.js + Supabase)

Versión en **Next.js (App Router)** del archivo original [`portal-automatizaciones-comercial.html`](./portal-automatizaciones-comercial.html), manteniendo exactamente el mismo diseño visual, modo claro/oscuro, flujo de carga y comportamiento responsive, pero con persistencia real en **Supabase** y listo para desplegar en **Vercel**.

---

## Características

- **Diseño idéntico al original**: paleta violeta/naranja Persat, tipografía `Montserrat`, tarjetas con indicador por vertical, modo claro/oscuro persistente y animaciones suaves.
- **Totalmente responsive**: adaptado para escritorio, tablets y celulares sin desbordes horizontales.
- **Base de datos en Supabase**: todas las consultas (altas, ediciones, cambios de estado y eliminaciones) se guardan en PostgreSQL vía Route Handlers de Next.js (`/api/consultas`).
- **Borrador automático local**: mientras escribís una nueva consulta, el borrador se guarda en `localStorage` para no perder avances si recargás la página.
- **Exportar / Importar JSON**: compatible con el formato de respaldo del HTML original para migrar o respaldar consultas en un clic.

---

## Estructura del proyecto

```text
├── GUIA-SUPABASE.md                  # Guía paso a paso para crear y conectar Supabase + Vercel
├── supabase/
│   └── schema.sql                    # Script SQL para crear la tabla `consultas` y políticas RLS
├── .env.example                      # Plantilla de variables de entorno
└── src/
    ├── types/
    │   └── consulta.ts               # Tipos TypeScript y constantes (verticales, estados, autores)
    ├── lib/
    │   ├── supabase.ts               # Cliente de Supabase para servidor
    │   └── consultas-api.ts          # Validaciones y helpers compartidos para las API routes
    └── app/
        ├── layout.tsx                # Layout raíz, fuente Montserrat e inicialización de tema
        ├── globals.css               # Estilos del portal + reglas responsive
        ├── page.tsx                  # Página principal (SSR con carga inicial desde Supabase)
        ├── components/
        │   └── PortalAutomatizaciones.tsx  # Interfaz interactiva completa del portal
        └── api/
            └── consultas/
                ├── route.ts          # GET (listar) y POST (crear consulta)
                ├── [id]/route.ts     # PATCH (editar / cambiar estado) y DELETE (eliminar)
                └── import/route.ts   # POST (importación masiva desde respaldo JSON)
```

---

## Inicio rápido

1. Configurá tu base de datos siguiendo [`GUIA-SUPABASE.md`](./GUIA-SUPABASE.md).
2. Instalá dependencias y ejecutá en local:

```bash
npm install
npm run dev
```

3. Abrí [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

- `npm run dev` — Inicia el servidor de desarrollo.
- `npm run build` — Compila la aplicación para producción (listo para Vercel).
- `npm run start` — Ejecuta el build de producción localmente.
- `npm run lint` — Ejecuta ESLint sobre el proyecto.
