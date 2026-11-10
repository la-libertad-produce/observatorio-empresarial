import Link from 'next/link';
import { listarSubgerencias } from '@/lib/datos';
import { Logo } from './Logo';
import { NavEnlaces } from './NavEnlaces';

export const MODO_DEMO = process.env.NEXT_PUBLIC_MODO_DEMO === 'true';

export function BarraInstitucional() {
  return (
    <div className="barra-inst">
      <div className="contenedor">
        <span>Gobierno Regional La Libertad</span>
        <span className="sep" aria-hidden="true">|</span>
        <span>Gerencia Regional de la Producción</span>
      </div>
    </div>
  );
}

export function FranjaDemo() {
  if (!MODO_DEMO) return null;
  return (
    <div className="franja-demo" role="note">
      <div className="contenedor">
        Versión de prueba. Los indicadores, metas y actores marcados como referenciales son datos de ejemplo y no corresponden a información oficial.
      </div>
    </div>
  );
}

export async function Encabezado() {
  const subs = await listarSubgerencias();
  const enlaces = [
    { href: '/', texto: 'Inicio' },
    ...subs.map((s) => ({ href: `/${s.slug}`, texto: s.nombre_corto })),
    { href: '/documentos', texto: 'Documentos de gestión' },
    { href: '/ecosistema', texto: 'Ecosistema' },
    { href: '/datos', texto: 'Datos abiertos' },
  ];
  return (
    <>
      <BarraInstitucional />
      <header className="encabezado">
        <div className="contenedor">
          <Logo />
          <NavEnlaces enlaces={enlaces} etiqueta="Secciones del observatorio" />
        </div>
      </header>
      <FranjaDemo />
    </>
  );
}

export function Pie() {
  return (
    <footer className="pie">
      <div className="contenedor">
        <div className="col" style={{ maxWidth: 560 }}>
          <strong>Observatorio La Libertad Produce</strong>
          <span>Gerencia Regional de la Producción, Gobierno Regional La Libertad. Iniciativa a cargo de la UTF-CTI.</span>
        </div>
        <div className="col">
          <Link href="/datos">Datos abiertos y metodología</Link>
          <Link href="/panel">Acceso para responsables de información</Link>
        </div>
      </div>
    </footer>
  );
}

export async function PaginaPublica({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado />
      <main id="contenido">{children}</main>
      <Pie />
    </>
  );
}
