'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type EnlaceNav = { href: string; texto: string };

export function NavEnlaces({ enlaces, etiqueta, clase = 'nav' }: { enlaces: EnlaceNav[]; etiqueta: string; clase?: string }) {
  const ruta = usePathname();
  const activo = (href: string) => (href === '/' || href === '/panel' ? ruta === href : ruta === href || ruta.startsWith(`${href}/`));
  return (
    <nav className={clase} aria-label={etiqueta}>
      {enlaces.map((e) => (
        <Link key={e.href} href={e.href} aria-current={activo(e.href) ? 'page' : undefined}>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}
