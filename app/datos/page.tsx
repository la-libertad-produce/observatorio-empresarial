import Link from 'next/link';
import type { Metadata } from 'next';
import { PaginaPublica } from '@/components/Marco';
import { listarIndicadores, resumir } from '@/lib/datos';
import { PERIODICIDAD, fecha } from '@/lib/formato';
import { etiquetaPeriodo } from '@/lib/periodos';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Datos abiertos y metodología' };

const DESCARGAS = [
  ['valores.csv', 'Valores publicados', 'Todos los valores de los indicadores, por periodo y sector.'],
  ['indicadores.csv', 'Fichas técnicas', 'Definición, método de cálculo, unidad, periodicidad y fuente de cada indicador.'],
  ['metas.csv', 'Metas de documentos de gestión', 'Línea de base, meta y último valor reportado de las metas prioritarias.'],
  ['actores.csv', 'Directorio del ecosistema', 'Actores validados del ecosistema de innovación y emprendimiento.'],
];

export default async function Datos() {
  const indicadores = await listarIndicadores().then(resumir);
  return (
    <PaginaPublica>
      <div className="contenedor">
        <div className="cabecera-pag">
          <div>
            <span className="eyebrow">Datos abiertos</span>
            <h1 className="titulo-pag">Datos abiertos y metodología</h1>
            <p className="bajada">La información del observatorio puede descargarse en formato CSV (UTF-8, separado por comas) para su libre reutilización, citando la fuente.</p>
          </div>
        </div>

        <section className="grilla" aria-label="Descargas">
          {DESCARGAS.map(([archivo, t, d]) => (
            <article key={archivo} className="tarjeta pad col">
              <strong style={{ fontSize: 17 }}>{t}</strong>
              <span className="texto-2" style={{ fontSize: 14 }}>{d}</span>
              <a className="btn btn-s" style={{ alignSelf: 'flex-start', marginTop: 8 }} href={`/descargas/${archivo}`} download>Descargar {archivo}</a>
            </article>
          ))}
        </section>

        <section className="seccion" style={{ paddingTop: 36 }}>
          <h2 className="h2">Catálogo de indicadores</h2>
          <div className="tarjeta tabla-caja">
            <table className="tabla">
              <thead>
                <tr><th scope="col">Código</th><th scope="col">Indicador</th><th scope="col">Área</th><th scope="col">Unidad</th><th scope="col">Periodicidad</th><th scope="col">Último periodo</th><th scope="col">Publicado</th></tr>
              </thead>
              <tbody>
                {indicadores.map((i) => (
                  <tr key={i.id}>
                    <td className="nw"><Link href={`/indicador/${i.codigo}`}>{i.codigo}</Link></td>
                    <td>{i.nombre}{i.referencial && <span className="nota"> (referencial)</span>}</td>
                    <td>{i.subgerencia_corto}</td>
                    <td>{i.unidad}</td>
                    <td>{PERIODICIDAD[i.periodicidad]}</td>
                    <td>{i.ultimo ? etiquetaPeriodo(i.ultimo.periodo) : 's. d.'}</td>
                    <td>{fecha(i.publicado_en)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tarjeta pad col" style={{ gap: 12, maxWidth: 860 }}>
          <h2 className="h2" style={{ fontSize: 19 }}>Nota metodológica</h2>
          <p className="texto-2">
            Los indicadores provienen de los registros administrativos de las subgerencias y unidades de la Gerencia Regional de la Producción. Cada área registra
            sus datos en una plantilla estándar; el sistema valida automáticamente códigos, periodos y valores, y la UTF-CTI revisa cada carga antes de su publicación.
          </p>
          <p className="texto-2">
            La variación interanual compara el valor de un periodo con el del mismo periodo del año anterior. Cuando un dato publicado se corrige, el nuevo valor reemplaza
            al anterior y la corrección queda registrada en el historial del sistema. La abreviatura «s. d.» indica que no se dispone del dato.
          </p>
        </section>
      </div>
    </PaginaPublica>
  );
}
