import type { Metadata } from 'next';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Observatorio La Libertad Produce', template: '%s | Observatorio La Libertad Produce' },
  description:
    'Indicadores de la actividad productiva de La Libertad, documentos de gestión y ecosistema de innovación. Gerencia Regional de la Producción, Gobierno Regional La Libertad.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="saltar" href="#contenido">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
