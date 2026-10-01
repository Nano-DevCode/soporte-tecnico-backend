// indicators/minio.health.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  constructor(private configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const s3 = new S3Client({
      endpoint: this.configService.getOrThrow<string>('MINIO_ENDPOINT'),
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('MINIO_ROOT_USER'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'MINIO_ROOT_PASSWORD',
        ),
      },
      forcePathStyle: true,
      requestHandler: {
        requestTimeout: 3000,
      },
    });

    try {
      await s3.send(new ListBucketsCommand({}));
      return this.getStatus(key, true);
    } catch (error) {
      // Validamos que sea una instancia de Error antes de extraer el mensaje
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido de MinIO';

      throw new HealthCheckError(
        'MinIO check failed',
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }
}
