import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth';
import { listarIndicadores } from '@/lib/datos';
import { PERIODICIDAD } from '@/lib/formato';

export default async function Indicadores() {
  await exigirUsuario(['admin', 'aprobador']);
  const indicadores = await listarIndicadores({ incluirInactivos: true });
  return (
    <>
      <div className="fila entre">
        <div className="col">
          <span className="eyebrow">Catálogo</span>
          <h1 className="titulo-pag" style={{ fontSize: 30 }}>Indicadores</h1>
          <p className="texto-2">Registre aquí los indicadores validados con cada subgerencia. La plantilla de carga se actualiza automáticamente.</p>
        </div>
        <Link className="btn btn-p" href="/panel/indicadores/nuevo">Nuevo indicador</Link>
      </div>
      <section className="tarjeta tabla-caja">
        <table className="tabla">
          <thead><tr><th scope="col">Código</th><th scope="col">Indicador</th><th scope="col">Área</th><th scope="col">Periodicidad</th><th scope="col">Estado</th><th scope="col"><span className="sr">Acciones</span></th></tr></thead>
          <tbody>
            {indicadores.map((i) => (
              <tr key={i.id}>
                <td className="nw">{i.codigo}</td>
                <td>{i.nombre}</td>
                <td>{i.subgerencia_corto}</td>
                <td>{PERIODICIDAD[i.periodicidad]}</td>
                <td className="fila" style={{ gap: 6 }}>
                  <span className={`etiqueta ${i.activo ? 'ok' : ''}`}>{i.activo ? 'Activo' : 'Inactivo'}</span>
                  {i.referencial && <span className="etiqueta aviso">Referencial</span>}
                  {i.destacado && <span className="etiqueta">Destacado</span>}
                </td>
                <td><Link href={`/panel/indicadores/${i.id}`}>Editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
