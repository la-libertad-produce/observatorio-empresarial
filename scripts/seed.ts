// Carga los catálogos iniciales y los DATOS DE EJEMPLO (marcados como referenciales).
// Uso:  npm run db:seed            -> solo si la base está vacía
//       npm run db:seed -- --reset -> borra todo y vuelve a cargar
import './_env';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { claveTemporal } from '../lib/claves';
import { parsePeriodo, type Periodicidad } from '../lib/periodos';

const reset = process.argv.includes('--reset');

const SUBGERENCIAS = [
  { slug: 'mype', nombre: 'Subgerencia de MYPE', corto: 'MYPE', desc: 'Formalización, asistencia técnica, capacitación y acceso a mercados de las micro y pequeñas empresas de la región.' },
  { slug: 'industria', nombre: 'Subgerencia de Industria', corto: 'Industria', desc: 'Desarrollo y supervisión de la actividad industrial y manufacturera de La Libertad.' },
  { slug: 'pesca', nombre: 'Subgerencia de Pesca', corto: 'Pesca', desc: 'Pesca artesanal, acuicultura y seguimiento de la actividad pesquera regional.' },
  { slug: 'cti', nombre: 'Unidad Técnica Funcional de CTI', corto: 'CTI', desc: 'Ciencia, tecnología e innovación productiva, en el marco del PRCTI 2026-2029.' },
];

const SECTORES = [
  'Agroindustria', 'Cuero y calzado', 'Textil y confecciones', 'Metalmecánica', 'Alimentos y bebidas',
  'Madera y muebles', 'Pesca artesanal', 'Acuicultura', 'Comercio', 'Servicios', 'Otros',
];

type Ind = {
  codigo: string; nombre: string; sub: string; unidad: string; periodicidad: Periodicidad;
  sectores?: string[]; base: number; dec?: number; destacado?: boolean; definicion: string; metodo: string; fuente: string;
};

const INDICADORES: Ind[] = [
  { codigo: 'MYPE-01', nombre: 'MYPE asistidas en su proceso de formalización', sub: 'mype', unidad: 'Número de empresas', periodicidad: 'mensual', sectores: ['Cuero y calzado', 'Textil y confecciones', 'Alimentos y bebidas', 'Comercio', 'Servicios'], base: 140, destacado: true,
    definicion: 'Micro y pequeñas empresas que reciben asistencia de la Gerencia para completar su formalización en el periodo.', metodo: 'Suma de empresas atendidas en el periodo, sin duplicar empresas.', fuente: 'Registro administrativo de la Subgerencia de MYPE' },
  { codigo: 'MYPE-02', nombre: 'Participantes en capacitaciones empresariales', sub: 'mype', unidad: 'Personas', periodicidad: 'mensual', base: 420,
    definicion: 'Personas que asisten a capacitaciones en gestión empresarial organizadas o coorganizadas por la Gerencia.', metodo: 'Suma de participantes registrados en las listas de asistencia.', fuente: 'Listas de asistencia de la Subgerencia de MYPE' },
  { codigo: 'IND-01', nombre: 'Visitas de asistencia técnica a plantas industriales', sub: 'industria', unidad: 'Número de visitas', periodicidad: 'mensual', sectores: ['Agroindustria', 'Metalmecánica', 'Alimentos y bebidas', 'Madera y muebles'], base: 36, destacado: true,
    definicion: 'Visitas técnicas realizadas a establecimientos industriales de la región.', metodo: 'Conteo de visitas con acta firmada en el periodo.', fuente: 'Registro de visitas de la Subgerencia de Industria' },
  { codigo: 'IND-02', nombre: 'Empresas industriales con registro vigente', sub: 'industria', unidad: 'Número de empresas', periodicidad: 'trimestral', sectores: ['Agroindustria', 'Metalmecánica', 'Alimentos y bebidas', 'Textil y confecciones', 'Cuero y calzado'], base: 1850,
    definicion: 'Empresas industriales inscritas con registro vigente al cierre del trimestre.', metodo: 'Stock de registros vigentes al último día del trimestre.', fuente: 'Registro de la Subgerencia de Industria' },
  { codigo: 'PES-01', nombre: 'Desembarque de la pesca artesanal', sub: 'pesca', unidad: 'Toneladas', periodicidad: 'mensual', base: 2600, dec: 1, destacado: true,
    definicion: 'Volumen de recursos hidrobiológicos desembarcados por la flota artesanal en los puntos de desembarque de la región.', metodo: 'Suma de los desembarques registrados en el periodo.', fuente: 'Registro de desembarques de la Subgerencia de Pesca' },
  { codigo: 'PES-02', nombre: 'Derechos acuícolas otorgados', sub: 'pesca', unidad: 'Número de derechos', periodicidad: 'trimestral', base: 14,
    definicion: 'Autorizaciones y concesiones acuícolas otorgadas en el trimestre.', metodo: 'Conteo de resoluciones emitidas en el trimestre.', fuente: 'Registro de la Subgerencia de Pesca' },
  { codigo: 'CTI-01', nombre: 'Proyectos de innovación con acompañamiento de la UTF-CTI', sub: 'cti', unidad: 'Número de proyectos', periodicidad: 'trimestral', base: 18, destacado: true,
    definicion: 'Proyectos de innovación empresarial que reciben acompañamiento técnico de la UTF-CTI en el trimestre.', metodo: 'Conteo de proyectos con ficha de seguimiento activa.', fuente: 'Portafolio de la UTF-CTI' },
  { codigo: 'CTI-02', nombre: 'Postulaciones regionales a fondos concursables de innovación', sub: 'cti', unidad: 'Número de postulaciones', periodicidad: 'trimestral', sectores: ['Agroindustria', 'Cuero y calzado', 'Textil y confecciones', 'Servicios', 'Otros'], base: 42,
    definicion: 'Postulaciones de empresas y entidades de La Libertad a fondos concursables de innovación con acompañamiento de la Gerencia.', metodo: 'Conteo de postulaciones presentadas en el trimestre.', fuente: 'Portafolio de la UTF-CTI' },
];

// Generador pseudoaleatorio determinista (los datos de ejemplo son siempre los mismos)
function prng(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function periodos(periodicidad: Periodicidad): string[] {
  const out: string[] = [];
  if (periodicidad === 'mensual') {
    for (let a = 2025; a <= 2026; a++) for (let m = 1; m <= 12; m++) {
      if (a === 2026 && m > 9) break;
      out.push(`${a}-${String(m).padStart(2, '0')}`);
    }
  } else if (periodicidad === 'trimestral') {
    for (const p of ['2025-T1', '2025-T2', '2025-T3', '2025-T4', '2026-T1', '2026-T2', '2026-T3']) out.push(p);
  } else {
    out.push('2024', '2025');
  }
  return out;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL');
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from subgerencias`;
  if (n > 0 && !reset) {
    console.log('La base ya tiene datos. Use `npm run db:seed -- --reset` para reiniciarla.');
    await sql.end();
    return;
  }

  const credenciales: { email: string; rol: string; clave: string }[] = [];

  await sql.begin(async (tx) => {
    if (reset) {
      await tx`truncate auditoria, valores, cargas, sesiones, usuarios, indicadores, metas, documentos, actores, enlaces, sectores, subgerencias restart identity cascade`;
    }

    const subIds: Record<string, number> = {};
    for (const [i, s] of SUBGERENCIAS.entries()) {
      const [r] = await tx<{ id: number }[]>`insert into subgerencias (slug, nombre, nombre_corto, descripcion, orden) values (${s.slug}, ${s.nombre}, ${s.corto}, ${s.desc}, ${i}) returning id`;
      subIds[s.slug] = r.id;
    }

    const secIds: Record<string, number> = {};
    for (const [i, nombre] of SECTORES.entries()) {
      const [r] = await tx<{ id: number }[]>`insert into sectores (nombre, orden) values (${nombre}, ${i}) returning id`;
      secIds[nombre] = r.id;
    }

    for (const [k, ind] of INDICADORES.entries()) {
      const [r] = await tx<{ id: number }[]>`
        insert into indicadores (codigo, nombre, subgerencia_id, unidad, periodicidad, desagrega_sector, definicion, metodo_calculo, fuente, decimales, destacado, referencial, orden)
        values (${ind.codigo}, ${ind.nombre}, ${subIds[ind.sub]}, ${ind.unidad}, ${ind.periodicidad}, ${!!ind.sectores}, ${ind.definicion}, ${ind.metodo}, ${ind.fuente}, ${ind.dec ?? 0}, ${!!ind.destacado}, true, ${k})
        returning id`;
      const rnd = prng(1000 + k * 77);
      const pers = periodos(ind.periodicidad);
      const factor = 10 ** (ind.dec ?? 0);
      const pesos = (ind.sectores ?? []).map(() => 0.5 + rnd());
      const sumaPesos = pesos.reduce((a, b) => a + b, 0);
      for (const [j, p] of pers.entries()) {
        const pp = parsePeriodo(p, ind.periodicidad)!;
        const tendencia = 1 + 0.012 * j;
        const estacional = ind.periodicidad === 'mensual' ? 1 + 0.12 * Math.sin((pp.indice / 12) * 2 * Math.PI) : 1;
        const ruido = 0.85 + 0.3 * rnd();
        if (ind.sectores) {
          let total = 0;
          for (const [si, sector] of ind.sectores.entries()) {
            const v = Math.max(0, Math.round((ind.base * tendencia * estacional * ruido * pesos[si] / sumaPesos) * (0.9 + 0.2 * rnd()) * factor) / factor);
            total += v;
            await tx`insert into valores (indicador_id, periodo, fecha, sector_id, valor, estado, publicado_en) values (${r.id}, ${pp.periodo}, ${pp.fecha}, ${secIds[sector]}, ${v}, 'publicado', now())`;
          }
          total = Math.round(total * factor) / factor;
          await tx`insert into valores (indicador_id, periodo, fecha, sector_id, valor, estado, publicado_en) values (${r.id}, ${pp.periodo}, ${pp.fecha}, ${null}, ${total}, 'publicado', now())`;
        } else {
          const v = Math.max(0, Math.round(ind.base * tendencia * estacional * ruido * factor) / factor);
          await tx`insert into valores (indicador_id, periodo, fecha, sector_id, valor, estado, publicado_en) values (${r.id}, ${pp.periodo}, ${pp.fecha}, ${null}, ${v}, 'publicado', now())`;
        }
      }
    }

    // Documentos de gestión
    const docs = [
      { sigla: 'PRCTI', nombre: 'Plan Regional de Ciencia, Tecnología e Innovación 2026-2029', norma: 'Ordenanza Regional N° 000013-2026-GRLL-CR', fecha: '2026-06-09', horizonte: '2026-2029', organo: 'Gerencia Regional de la Producción', estado: 'vigente', resumen: 'Instrumento que orienta la intervención regional en ciencia, tecnología e innovación.' },
      { sigla: 'PDRC', nombre: 'Plan de Desarrollo Regional Concertado', norma: '', fecha: null, horizonte: '', organo: 'Gobierno Regional La Libertad', estado: 'por_confirmar', resumen: '' },
      { sigla: 'PRCP', nombre: 'Plan Regional de Competitividad y Productividad', norma: '', fecha: null, horizonte: '', organo: '', estado: 'por_confirmar', resumen: '' },
      { sigla: 'PEI', nombre: 'Plan Estratégico Institucional', norma: '', fecha: null, horizonte: '', organo: 'Gobierno Regional La Libertad', estado: 'por_confirmar', resumen: '' },
      { sigla: 'POI', nombre: 'Plan Operativo Institucional', norma: '', fecha: null, horizonte: '', organo: 'Gobierno Regional La Libertad', estado: 'por_confirmar', resumen: '' },
    ];
    for (const [i, d] of docs.entries()) {
      const [r] = await tx<{ id: number }[]>`
        insert into documentos (sigla, nombre, norma, fecha_aprobacion, horizonte, organo, estado_vigencia, resumen, orden)
        values (${d.sigla}, ${d.nombre}, ${d.norma}, ${d.fecha}, ${d.horizonte}, ${d.organo}, ${d.estado}, ${d.resumen}, ${i}) returning id`;
      if (d.sigla === 'PRCTI') {
        const metas: [string, string, number, number, number | null][] = [
          ['Proyectos de I+D+i con cofinanciamiento público ejecutados en la región', 'Proyectos', 12, 40, 19],
          ['Empresas regionales que acceden a fondos concursables de innovación', 'Empresas', 35, 120, 58],
          ['Municipalidades con capacidades en desarrollo económico local e innovación', 'Municipalidades', 4, 20, 9],
          ['Investigadores calificados con filiación en instituciones de la región', 'Investigadores', 210, 300, 236],
          ['Acuerdos de vinculación entre universidades y empresas vigentes', 'Acuerdos', 6, 25, 10],
          ['Actores del ecosistema registrados y validados en el observatorio', 'Actores', 0, 150, null],
        ];
        for (const [j, m] of metas.entries()) {
          await tx`insert into metas (documento_id, orden, descripcion, unidad, linea_base, meta, ultimo_valor, fuente, referencial)
                   values (${r.id}, ${j}, ${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4]}, 'Reportes de seguimiento del PRCTI 2026-2029', true)`;
        }
      }
    }

    // Ecosistema (ubicaciones aproximadas, referenciales)
    const actores = [
      ['Universidad Nacional de Trujillo', 'academia', 'Trujillo', 'Multisectorial', 'Investigación aplicada, transferencia tecnológica y formación de capital humano.', -8.112, -79.036],
      ['Universidad Privada Antenor Orrego', 'academia', 'Trujillo', 'Multisectorial', 'Investigación, formación profesional y programas de emprendimiento universitario.', -8.114, -79.019],
      ['CITEccal Trujillo', 'academia', 'Trujillo', 'Cuero y calzado', 'Asistencia técnica, ensayos de laboratorio y capacitación para la cadena de cuero y calzado.', -8.083, -79.009],
      ['CITEagroindustrial Chavimochic', 'academia', 'Virú', 'Agroindustria', 'Servicios tecnológicos y transferencia para la agroindustria regional.', -8.415, -78.752],
      ['ProInnóvate', 'soporte', null, 'Multisectorial', 'Fondos concursables para innovación empresarial y emprendimientos dinámicos.', null, null],
      ['PROCIENCIA', 'soporte', null, 'Multisectorial', 'Financiamiento de proyectos de investigación, desarrollo tecnológico e innovación.', null, null],
      ['Cámara de Comercio y Producción de La Libertad', 'gremios', 'Trujillo', 'Multisectorial', 'Representación gremial, servicios empresariales y articulación con el sector público.', -8.109, -79.03],
      ['Gerencia Regional de la Producción, GRLL', 'gobierno', 'Trujillo', 'Multisectorial', 'Promoción productiva, CTI regional y gestión de instrumentos como PROCOMPITE.', -8.104, -79.025],
      ['Municipalidad Provincial de Trujillo', 'gobierno', 'Trujillo', 'Multisectorial', 'Desarrollo económico local y promoción del emprendimiento en la provincia.', -8.111, -79.029],
    ] as const;
    for (const a of actores) {
      await tx`insert into actores (nombre, categoria, provincia, sector, descripcion, lat, lng, referencial)
               values (${a[0]}, ${a[1]}, ${a[2]}, ${a[3]}, ${a[4]}, ${a[5]}, ${a[6]}, true)`;
    }

    await tx`insert into enlaces (nombre, responsable, descripcion, url, orden) values
      ('Observatorio de innovación y emprendimiento', 'Asociación Pataz', 'Seguimiento del ecosistema regional de innovación y emprendimiento.', null, 0),
      ('Observatorio regional', 'CERPLAN, Gobierno Regional La Libertad', 'Información para el planeamiento estratégico regional.', null, 1)`;

    // Usuarios iniciales
    const usuarios = [
      { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@observatorio.local', nombre: process.env.SEED_ADMIN_NOMBRE ?? 'Administrador', rol: 'admin', sub: null as string | null },
      { email: 'utf-cti@observatorio.local', nombre: 'Revisor UTF-CTI', rol: 'aprobador', sub: 'cti' },
      { email: 'mype@observatorio.local', nombre: 'Usuario Subgerencia de MYPE', rol: 'cargador', sub: 'mype' },
      { email: 'industria@observatorio.local', nombre: 'Usuario Subgerencia de Industria', rol: 'cargador', sub: 'industria' },
      { email: 'pesca@observatorio.local', nombre: 'Usuario Subgerencia de Pesca', rol: 'cargador', sub: 'pesca' },
    ];
    for (const u of usuarios) {
      const clave = claveTemporal();
      const hash = await bcrypt.hash(clave, 11);
      await tx`insert into usuarios (email, nombre, password_hash, rol, subgerencia_id) values (${u.email.toLowerCase()}, ${u.nombre}, ${hash}, ${u.rol}, ${u.sub ? subIds[u.sub] : null})`;
      credenciales.push({ email: u.email.toLowerCase(), rol: u.rol, clave });
    }
  });

  console.log('Datos iniciales cargados (indicadores, metas y actores marcados como referenciales).');
  console.log('\nCuentas creadas. Las claves son temporales y deben cambiarse en el primer ingreso:\n');
  for (const c of credenciales) console.log(`  ${c.rol.padEnd(10)} ${c.email.padEnd(34)} ${c.clave}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
