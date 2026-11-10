import { exigirUsuario } from '@/lib/auth';
import { indicadoresDelUsuario } from '@/lib/excel';
import { FORMATO_PERIODO } from '@/lib/periodos';
import { PERIODICIDAD } from '@/lib/formato';
import { FormCarga } from './FormCarga';

export default async function Cargar() {
  const u = await exigirUsuario();
  const indicadores = await indicadoresDelUsuario(u);
  return (
    <>
      <div className="col">
        <span className="eyebrow">Carga de datos</span>
        <h1 className="titulo-pag" style={{ fontSize: 30 }}>Cargar datos</h1>
        <p className="texto-2">Todas las áreas usan la misma plantilla. Descárguela, complete los valores y súbala aquí. El sistema la valida al instante.</p>
      </div>

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <span className="eyebrow">Paso 1</span>
        <h2 className="h2" style={{ fontSize: 19 }}>Descargue la plantilla estándar</h2>
        <p className="texto-2">
          La plantilla viene prellenada con el siguiente periodo de cada uno de sus {indicadores.length} indicadores. Incluye listas desplegables de códigos y sectores, e instrucciones.
        </p>
        <a className="btn btn-s" style={{ alignSelf: 'flex-start' }} href="/panel/plantilla">Descargar plantilla (.xlsx)</a>
      </section>

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <span className="eyebrow">Paso 2</span>
        <h2 className="h2" style={{ fontSize: 19 }}>Suba el archivo completado</h2>
        <FormCarga />
      </section>

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <h2 className="h2" style={{ fontSize: 19 }}>Indicadores que puede cargar</h2>
        <div className="tabla-caja">
          <table className="tabla">
            <thead><tr><th scope="col">Código</th><th scope="col">Indicador</th><th scope="col">Unidad</th><th scope="col">Periodo</th><th scope="col">Por sector</th></tr></thead>
            <tbody>
              {indicadores.map((i) => (
                <tr key={i.id}>
                  <td className="nw">{i.codigo}</td><td>{i.nombre}</td><td>{i.unidad}</td>
                  <td>{PERIODICIDAD[i.periodicidad]}: {FORMATO_PERIODO[i.periodicidad]}</td>
                  <td>{i.desagrega_sector ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
