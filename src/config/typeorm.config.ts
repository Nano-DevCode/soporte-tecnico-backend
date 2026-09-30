import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Forzamos la carga del .env (especificando la ruta por si el CLI se pierde)
dotenv.config({ path: join(__dirname, '../../.env') });

// Corregimos el console.log para ver las credenciales
console.log('--- Verificando Conexión ---');
console.log({
  host: process.env.DB_HOST_POSTGRES,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  pass: process.env.DB_PASSWORD ? '******' : 'NO HAY PASSWORD', // Por seguridad
  db: process.env.DB_NAME,
});
console.log('---------------------------');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST_POSTGRES,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Rutas ajustadas para que encuentre las entidades y migraciones
  entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/../database/migrations/*{.ts,.js}')],

  synchronize: false,
  logging: true,
});
