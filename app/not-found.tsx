import Link from 'next/link';
import { PaginaPublica } from '@/components/Marco';

export default function NoEncontrado() {
  return (
    <PaginaPublica>
      <div className="contenedor cabecera-pag">
        <div>
          <span className="eyebrow">Error 404</span>
          <h1 className="titulo-pag">No encontramos esta página</h1>
          <p className="bajada">Es posible que la dirección haya cambiado. <Link href="/">Volver al inicio</Link>.</p>
        </div>
      </div>
    </PaginaPublica>
  );
}
