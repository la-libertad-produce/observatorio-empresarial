-- Observatorio La Libertad Produce
-- Esquema de base de datos (PostgreSQL 15+, compatible con Supabase).
-- Se ejecuta con `npm run db:migrate`. Es idempotente.

create table if not exists subgerencias (
  id            serial primary key,
  slug          text not null unique,          -- usado en la URL: /mype, /industria
  nombre        text not null,                 -- "Subgerencia de MYPE"
  nombre_corto  text not null,                 -- "MYPE" (menú)
  descripcion   text not null default '',
  orden         int  not null default 0,
  activo        boolean not null default true
);

create table if not exists sectores (
  id      serial primary key,
  nombre  text not null unique,
  orden   int  not null default 0
);

-- Ficha técnica de cada indicador
create table if not exists indicadores (
  id                serial primary key,
  codigo            text not null unique,      -- p. ej. MYPE-01
  nombre            text not null,
  subgerencia_id    int  not null references subgerencias(id),
  unidad            text not null,             -- "Número de empresas", "Toneladas", "Soles"
  periodicidad      text not null check (periodicidad in ('mensual','trimestral','anual')),
  desagrega_sector  boolean not null default false,
  definicion        text not null default '',
  metodo_calculo    text not null default '',
  fuente            text not null default '',
  decimales         int  not null default 0 check (decimales between 0 and 4),
  permite_negativos boolean not null default false,
  destacado         boolean not null default false,  -- aparece en la portada
  referencial       boolean not null default false,  -- datos de ejemplo
  activo            boolean not null default true,
  orden             int  not null default 0,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);
create index if not exists indicadores_subgerencia_idx on indicadores(subgerencia_id);

create table if not exists usuarios (
  id              serial primary key,
  email           text not null unique,
  nombre          text not null,
  password_hash   text not null,
  rol             text not null check (rol in ('admin','aprobador','cargador')),
  subgerencia_id  int references subgerencias(id),
  activo          boolean not null default true,
  debe_cambiar_clave boolean not null default true,
  creado_en       timestamptz not null default now(),
  ultimo_acceso   timestamptz
);

create table if not exists sesiones (
  token_hash  text primary key,               -- sha256 del token de la cookie
  usuario_id  int not null references usuarios(id) on delete cascade,
  expira_en   timestamptz not null,
  creado_en   timestamptz not null default now()
);
create index if not exists sesiones_usuario_idx on sesiones(usuario_id);

-- Cada archivo Excel subido es una "carga"
create table if not exists cargas (
  id               serial primary key,
  subgerencia_id   int references subgerencias(id),   -- null = carga de varias subgerencias
  usuario_id       int not null references usuarios(id),
  archivo_nombre   text not null,
  archivo          bytea,
  n_filas          int not null default 0,
  advertencias     jsonb not null default '[]'::jsonb,
  estado           text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  observacion      text,
  revisado_por     int references usuarios(id),
  revisado_en      timestamptz,
  creado_en        timestamptz not null default now()
);
create index if not exists cargas_estado_idx on cargas(estado);

-- Valores de los indicadores
create table if not exists valores (
  id            bigserial primary key,
  indicador_id  int not null references indicadores(id) on delete cascade,
  periodo       text not null,                 -- 2026-09 | 2026-T3 | 2026
  fecha         date not null,                 -- primer día del periodo (para ordenar)
  sector_id     int references sectores(id),   -- null = total
  valor         numeric not null,
  observacion   text,
  carga_id      int references cargas(id) on delete cascade,
  estado        text not null default 'pendiente' check (estado in ('pendiente','publicado','reemplazado','rechazado')),
  publicado_en  timestamptz
);
create index if not exists valores_indicador_idx on valores(indicador_id, fecha);
create index if not exists valores_carga_idx on valores(carga_id);
-- Solo un valor publicado por indicador, periodo y sector
create unique index if not exists valores_publicado_unico
  on valores(indicador_id, periodo, coalesce(sector_id, 0))
  where estado = 'publicado';

-- Documentos de gestión
create table if not exists documentos (
  id                serial primary key,
  sigla             text not null unique,
  nombre            text not null,
  norma             text not null default '',
  fecha_aprobacion  date,
  horizonte         text not null default '',
  organo            text not null default '',
  estado_vigencia   text not null default 'por_confirmar' check (estado_vigencia in ('vigente','por_confirmar','en_actualizacion','no_vigente')),
  url_documento     text,
  resumen           text not null default '',
  orden             int not null default 0
);

create table if not exists metas (
  id             serial primary key,
  documento_id   int not null references documentos(id) on delete cascade,
  orden          int not null default 0,
  descripcion    text not null,
  unidad         text not null default '',
  linea_base     numeric,
  meta           numeric,
  ultimo_valor   numeric,                       -- null = sin reporte oficial
  fecha_reporte  date,
  fuente         text not null default '',
  referencial    boolean not null default false
);

-- Ecosistema de innovación y emprendimiento
create table if not exists actores (
  id           serial primary key,
  nombre       text not null,
  categoria    text not null check (categoria in ('academia','soporte','gremios','gobierno')),
  provincia    text,                            -- null = alcance nacional
  sector       text not null default '',
  descripcion  text not null default '',
  servicios    text not null default '',
  web          text,
  lat          double precision,
  lng          double precision,
  validado     boolean not null default true,
  referencial  boolean not null default false
);

-- Enlaces a observatorios complementarios (para no duplicar esfuerzos)
create table if not exists enlaces (
  id           serial primary key,
  nombre       text not null,
  responsable  text not null default '',
  descripcion  text not null default '',
  url          text,
  orden        int not null default 0
);

create table if not exists auditoria (
  id          bigserial primary key,
  usuario_id  int references usuarios(id),
  accion      text not null,
  detalle     jsonb not null default '{}'::jsonb,
  creado_en   timestamptz not null default now()
);
create index if not exists auditoria_fecha_idx on auditoria(creado_en desc);

-- Seguridad en Supabase: se activa RLS sin políticas en todas las tablas.
-- Así la API pública de Supabase (PostgREST) no expone ningún dato; la aplicación
-- se conecta directamente con el rol propietario, que no está sujeto a RLS.
alter table subgerencias enable row level security;
alter table sectores     enable row level security;
alter table indicadores  enable row level security;
alter table usuarios     enable row level security;
alter table sesiones     enable row level security;
alter table cargas       enable row level security;
alter table valores      enable row level security;
alter table documentos   enable row level security;
alter table metas        enable row level security;
alter table actores      enable row level security;
alter table enlaces      enable row level security;
alter table auditoria    enable row level security;
