// Crea un usuario desde la terminal.
// Uso: npm run db:usuario -- correo@dominio "Nombre Apellido" rol [slug-subgerencia]
//   rol: admin | aprobador | cargador
import './_env';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { claveTemporal } from '../lib/claves';

async function main() {
  const [email, nombre, rol, sub] = process.argv.slice(2);
  if (!email || !nombre || !['admin', 'aprobador', 'cargador'].includes(rol)) {
    console.log('Uso: npm run db:usuario -- correo@dominio "Nombre" admin|aprobador|cargador [subgerencia]');
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  let subId: number | null = null;
  if (sub) {
    const r = await sql<{ id: number }[]>`select id from subgerencias where slug = ${sub}`;
    if (!r.length) throw new Error(`No existe la subgerencia "${sub}"`);
    subId = r[0].id;
  }
  if (rol === 'cargador' && !subId) throw new Error('Un usuario cargador necesita una subgerencia');
  const clave = claveTemporal();
  await sql`insert into usuarios (email, nombre, password_hash, rol, subgerencia_id) values (${email.toLowerCase()}, ${nombre}, ${await bcrypt.hash(clave, 11)}, ${rol}, ${subId})`;
  console.log(`Usuario creado: ${email.toLowerCase()}  clave temporal: ${clave}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
