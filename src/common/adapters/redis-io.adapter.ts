import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { INestApplication } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(app: INestApplication) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = new Redis({
      host: process.env.DB_HOST_REDIS || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) =>
      console.error('Redis Pub Client Error', err),
    );
    subClient.on('error', (err) =>
      console.error('Redis Sub Client Error', err),
    );

    // Esperamos a que los clientes estén listos para resolver la promesa
    await Promise.all([
      new Promise<void>((resolve) => pubClient.once('ready', () => resolve())),
      new Promise<void>((resolve) => subClient.once('ready', () => resolve())),
    ]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }
}
