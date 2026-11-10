// Carga .env si existe (Node 20.12+), sin dependencias externas.
try {
  process.loadEnvFile('.env');
} catch {
  // sin .env: se usan las variables del entorno
}
