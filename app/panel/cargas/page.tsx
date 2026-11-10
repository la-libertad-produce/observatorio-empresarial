import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth';
import { listarCargas } from '@/lib/cargas';
import { fechaHora } from '@/lib/formato';
import { EstadoCarga } from '@/components/EstadoCarga';

const FILTROS = [
  ['', 'Todas'],
  ['pendiente', 'Pendientes'],
  ['aprobada', 'Aprobadas'],
  ['rechazada', 'Devueltas'],
];

export default async function Cargas({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const u = await exigirUsuario();
  const { estado = '' } = await searchParams;
  const esCargador = u.rol === 'cargador';
  const cargas = await listarCargas({
    estado: FILTROS.some(([k]) => k === estado) && estado ? estado : undefined,
    subgerenciaId: esCargador ? u.subgerencia_id ?? -1 : undefined,
    limite: 200,
  });
  return (
    <>
      <div className="col">
        <span className="eyebrow">Cargas</span>
        <h1 className="titulo-pag" style={{ fontSize: 30 }}>{esCargador ? 'Cargas de mi área' : 'Revisión de cargas'}</h1>
        {!esCargador && <p className="texto-2">Revise cada carga pendiente y apruébela para publicarla, o devuélvala con observaciones.</p>}
      </div>
      <nav className="chips" aria-label="Filtrar por estado">
        {FILTROS.map(([k, t]) => (
          <Link key={k} href={k ? `/panel/cargas?estado=${k}` : '/panel/cargas'} className="chip" aria-pressed={estado === k} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{t}</Link>
        ))}
      </nav>
      <section className="tarjeta tabla-caja">
        {cargas.length ? (
          <table className="tabla">
            <thead><tr><th scope="col">N°</th><th scope="col">Fecha</th><th scope="col">Área</th><th scope="col">Cargado por</th><th scope="col">Archivo</th><th scope="col" className="der">Filas</th><th scope="col">Alertas</th><th scope="col">Estado</th></tr></thead>
            <tbody>
              {cargas.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/panel/cargas/${c.id}`}>{c.id}</Link></td>
                  <td>{fechaHora(c.creado_en)}</td>
                  <td>{c.subgerencia ?? 'Varias'}</td>
                  <td>{c.usuario}</td>
                  <td><Link href={`/panel/cargas/${c.id}`}>{c.archivo_nombre}</Link></td>
                  <td className="der num">{c.n_filas}</td>
                  <td>{c.advertencias.length ? <span className="etiqueta aviso">{c.advertencias.length}</span> : '—'}</td>
                  <td><EstadoCarga estado={c.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="texto-2" style={{ padding: 24 }}>No hay cargas en esta categoría.</p>
        )}
      </section>
    </>
  );
}
