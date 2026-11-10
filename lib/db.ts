import postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;
const globalParaDb = globalThis as unknown as { __sql?: Sql };

function crear(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta la variable de entorno DATABASE_URL');
  return postgres(url, {
    // prepare:false es necesario con el "transaction pooler" de Supabase
    prepare: false,
    max: Number(process.env.DB_MAX_CONEXIONES ?? 5),
    idle_timeout: 20,
    connect_timeout: 15,
    types: {
      // numeric -> number (los valores de los indicadores caben en double)
      numeric: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
    },
  });
}

export function db(): Sql {
  if (!globalParaDb.__sql) globalParaDb.__sql = crear();
  return globalParaDb.__sql;
}
