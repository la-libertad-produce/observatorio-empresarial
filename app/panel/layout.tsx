import type { Metadata } from 'next';
import { BarraInstitucional } from '@/components/Marco';
import { Logo } from '@/components/Logo';
import { NavEnlaces } from '@/components/NavEnlaces';
import { ETIQUETA_ROL, usuarioActual } from '@/lib/auth';
import { salir } from './acciones';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Panel', robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await usuarioActual();
  const menu = u
    ? [
        { href: '/panel', texto: 'Resumen' },
        { href: '/panel/cargar', texto: 'Cargar datos' },
        { href: '/panel/cargas', texto: u.rol === 'cargador' ? 'Mis cargas' : 'Revisión de cargas' },
        ...(u.rol !== 'cargador'
          ? [
              { href: '/panel/indicadores', texto: 'Indicadores' },
              { href: '/panel/documentos', texto: 'Documentos y metas' },
              { href: '/panel/ecosistema', texto: 'Ecosistema' },
            ]
          : []),
        ...(u.rol === 'admin'
          ? [
              { href: '/panel/usuarios', texto: 'Usuarios' },
              { href: '/panel/auditoria', texto: 'Historial' },
            ]
          : []),
        { href: '/panel/clave', texto: 'Cambiar clave' },
      ]
    : [];

  return (
    <>
      <BarraInstitucional />
      <header className="encabezado">
        <div className="contenedor">
          <Logo />
          {u && (
            <div className="fila" style={{ gap: 16 }}>
              <span className="col" style={{ gap: 0, textAlign: 'right' }}>
                <strong style={{ fontSize: 14 }}>{u.nombre}</strong>
                <span className="nota" style={{ fontSize: 12 }}>{ETIQUETA_ROL[u.rol]}{u.subgerencia_nombre ? ` · ${u.subgerencia_nombre}` : ''}</span>
              </span>
              <form action={salir}><button className="btn btn-s btn-chico" type="submit">Cerrar sesión</button></form>
            </div>
          )}
        </div>
      </header>
      <main id="contenido" className="contenedor" style={{ paddingBottom: 64 }}>
        {u && !u.debe_cambiar_clave ? (
          <div className="panel">
            <div className="tarjeta panel-menu">
              <NavEnlaces enlaces={menu} etiqueta="Menú del panel" clase="panel-nav" />
            </div>
            <div className="panel-cuerpo">{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
