import './_env';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL');
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const esquema = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  await sql.unsafe(esquema);
  console.log('Esquema aplicado correctamente.');
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
