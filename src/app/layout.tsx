import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal de Automatizaciones · Comercial Persat',
  description:
    'Centralizá las ideas de automatización que surgen en cada deal. Cargá la consulta, indicá la vertical y el tipo de negocio, y describí cómo te imaginás la solución.',
};

const themeInitScript = `
(function(){
  try {
    var k = 'persat_portal_automatizaciones_v1_theme';
    var t = localStorage.getItem(k);
    if (t !== 'dark' && t !== 'light') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

