import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth';
import { listarCargas } from '@/lib/cargas';
import { db } from '@/lib/db';
import { indicadoresDelUsuario } from '@/lib/excel';
import { resumir } from '@/lib/datos';
import { fechaHora } from '@/lib/formato';
import { etiquetaPeriodo, periodoReciente } from '@/lib/periodos';
import { EstadoCarga } from '@/components/EstadoCarga';

export default async function Resumen() {
  const u = await exigirUsuario();
  const esCargador = u.rol === 'cargador';
  const [cargas, pendientes, indicadores, [{ solicitudes }]] = await Promise.all([
    listarCargas({ usuarioId: esCargador ? u.id : undefined, limite: 6 }),
    esCargador ? Promise.resolve([]) : listarCargas({ estado: 'pendiente' }),
    indicadoresDelUsuario(u).then(resumir),
    db()<{ solicitudes: number }[]>`select count(*)::int as solicitudes from actores where not validado`,
  ]);
  const atrasados = indicadores.filter((i) => !i.ultimo || i.ultimo.periodo < periodoReciente(i.periodicidad));

  return (
    <>
      <div className="col">
        <span className="eyebrow">Panel</span>
        <h1 className="titulo-pag" style={{ fontSize: 30 }}>Hola, {u.nombre.split(' ')[0]}</h1>
      </div>

      <div className="grilla" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {!esCargador && (
          <Link href="/panel/cargas?estado=pendiente" className="tarjeta pad col" style={{ textDecoration: 'none', color: 'inherit', gap: 2 }}>
            <span className="num" style={{ fontSize: 32, fontWeight: 600 }}>{pendientes.length}</span>
            <span className="texto-2">cargas por revisar</span>
          </Link>
        )}
        <div className="tarjeta pad col" style={{ gap: 2 }}>
          <span className="num" style={{ fontSize: 32, fontWeight: 600, color: atrasados.length ? 'var(--baja)' : undefined }}>{atrasados.length}</span>
          <span className="texto-2">indicadores sin el último periodo</span>
        </div>
        {!esCargador && (
          <Link href="/panel/ecosistema" className="tarjeta pad col" style={{ textDecoration: 'none', color: 'inherit', gap: 2 }}>
            <span className="num" style={{ fontSize: 32, fontWeight: 600 }}>{solicitudes}</span>
            <span className="texto-2">solicitudes del ecosistema</span>
          </Link>
        )}
      </div>

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <div className="fila entre">
          <h2 className="h2" style={{ fontSize: 19 }}>Estado de los indicadores</h2>
          <Link className="btn btn-p btn-chico" href="/panel/cargar">Cargar datos</Link>
        </div>
        <div className="tabla-caja">
          <table className="tabla">
            <thead><tr><th scope="col">Código</th><th scope="col">Indicador</th><th scope="col">Último periodo publicado</th><th scope="col">Esperado</th></tr></thead>
            <tbody>
              {indicadores.map((i) => {
                const esperado = periodoReciente(i.periodicidad);
                const al_dia = i.ultimo && i.ultimo.periodo >= esperado;
                return (
                  <tr key={i.id}>
                    <td className="nw">{i.codigo}</td>
                    <td>{i.nombre}</td>
                    <td>{i.ultimo ? etiquetaPeriodo(i.ultimo.periodo) : 'Sin datos'}</td>
                    <td><span className={`etiqueta ${al_dia ? 'ok' : 'aviso'}`}>{al_dia ? 'Al día' : `Falta ${etiquetaPeriodo(esperado)}`}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <div className="fila entre">
          <h2 className="h2" style={{ fontSize: 19 }}>{esCargador ? 'Mis últimas cargas' : 'Últimas cargas'}</h2>
          <Link href="/panel/cargas">Ver todas</Link>
        </div>
        {cargas.length ? (
          <div className="tabla-caja">
            <table className="tabla">
              <thead><tr><th scope="col">N°</th><th scope="col">Fecha</th><th scope="col">Área</th><th scope="col">Archivo</th><th scope="col">Estado</th></tr></thead>
              <tbody>
                {cargas.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/panel/cargas/${c.id}`}>{c.id}</Link></td>
                    <td>{fechaHora(c.creado_en)}</td>
                    <td>{c.subgerencia ?? 'Varias'}</td>
                    <td>{c.archivo_nombre}</td>
                    <td><EstadoCarga estado={c.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="texto-2">Todavía no hay cargas registradas.</p>
        )}
      </section>
    </>
  );
}
