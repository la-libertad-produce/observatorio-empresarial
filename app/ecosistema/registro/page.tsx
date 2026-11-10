import type { Metadata } from 'next';
import { PaginaPublica } from '@/components/Marco';
import { FormRegistroActor } from './FormRegistroActor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Registrar una organización' };

export default function Registro() {
  return (
    <PaginaPublica>
      <div className="contenedor" style={{ maxWidth: 860 }}>
        <div className="cabecera-pag">
          <div>
            <span className="eyebrow">Ecosistema</span>
            <h1 className="titulo-pag">Registrar una organización</h1>
            <p className="bajada">
              Complete el formulario para solicitar la incorporación de su organización al directorio. La UTF-CTI revisará la información antes de publicarla.
            </p>
          </div>
        </div>
        <FormRegistroActor />
      </div>
    </PaginaPublica>
  );
}
