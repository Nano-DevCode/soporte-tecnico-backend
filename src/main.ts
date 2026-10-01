import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from './common/services/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = await app.resolve(AppLoggerService);
  app.useLogger(logger);

  const config = new DocumentBuilder()
    .setTitle('API de la Ticketera') // El título de tu proyecto
    .setDescription('Documentación de los endpoints para el sistema de tickets')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.setGlobalPrefix('api');

  // 1. El Pipe que traduce y valida
  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 2. EL FILTRO FALTANTE: Captura el error del pipe y formatea la respuesta
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false, // En false, devuelve un array de strings limpio en "message"
    }),
  );

  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get<string[]>('allowed_origins') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `Servidor nest corriendo en el puerto: ${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
