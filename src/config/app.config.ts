export const AppConfiguration = () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  base_url: process.env.BASE_URL || 'http://localhost:3000',
  cookie_secure: process.env.COOKIE_SECURE || true,
  allowed_origins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],

  // ===============================
  // POSTGRES
  // ===============================
  db_synchronize: process.env.DB_SYNCHRONIZE || 'true',

  db_host: process.env.DB_HOST_POSTGRES,
  db_port: parseInt(process.env.DB_PORT ?? '5432', 10),
  db_username: process.env.DB_USERNAME,
  //db_username: process.env.DB_USERNAME || process.env.DB_USER,
  db_password: process.env.DB_PASSWORD,
  db_name: process.env.DB_NAME,

  // ===============================
  // REDIS
  // ===============================
  redis_host: process.env.DB_HOST_REDIS,
  redis_port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  redis_password: process.env.REDIS_PASSWORD,

  // ===============================
  // MINIO
  // ===============================
  minio_root_user: process.env.MINIO_ROOT_USER,
  minio_root_password: process.env.MINIO_ROOT_PASSWORD,
  minio_endpoint: process.env.MINIO_ENDPOINT,
  minio_region: process.env.MINIO_REGION,

  // ===============================
  // TELEGRAM
  // ===============================
  telegram_token: process.env.TELEGRAM_TOKEN,

  // ===============================
  // GMAIL
  // ===============================
  email_token: process.env.EMAIL_TOKEN,
  email_user: process.env.EMAIL_USER,

  // ===============================
  // JWT
  // ===============================
  jwt_secret: process.env.JWT_SECRET,
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '2h',

  signature_secret_key: process.env.SIGNATURE_SECRET_KEY,
});
