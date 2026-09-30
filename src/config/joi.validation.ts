import Joi from 'joi';

export const JoiValidationSchema = Joi.object({
  // ===============================
  // ENTORNO
  // ===============================
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  PORT: Joi.number().default(3000),
  BASE_URL: Joi.string().default('http://localhost:3000'),
  COOKIE_SECURE: Joi.boolean().default(true),

  // ===============================
  // POSTGRES
  // ===============================
  DB_SYNCHRONIZE: Joi.boolean().default(false),

  DB_HOST_POSTGRES: Joi.string().hostname().default('localhost'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().allow('').default(''),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),

  // ===============================
  // REDIS
  // ===============================
  DB_HOST_REDIS: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // ===============================
  // MINIO
  // ===============================
  MINIO_ROOT_USER: Joi.string().allow('').default(''),
  MINIO_ROOT_PASSWORD: Joi.string().allow('').default(''),
  MINIO_ENDPOINT: Joi.string().uri().required(),
  MINIO_REGION: Joi.string().default('us-east-1'),

  // ===============================
  // TELEGRAM
  // ===============================
  TELEGRAM_TOKEN: Joi.string().allow('').default(''),

  // ===============================
  // GMAIL
  // ===============================
  EMAIL_TOKEN: Joi.string().allow('').default(''),
  EMAIL_USER: Joi.string().email().allow('').default(''),

  // ===============================
  // JWT
  // ===============================
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('2h'),

  SIGNATURE_SECRET_KEY: Joi.string().min(32).required(),
});
