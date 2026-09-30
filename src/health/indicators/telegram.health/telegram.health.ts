// indicators/telegram.health.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TelegramGetMeResponse {
  ok: boolean;
  result?: {
    username?: string;
  };
}

@Injectable()
export class TelegramHealthIndicator extends HealthIndicator {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const token = this.configService.get<string>('TELEGRAM_TOKEN');
    const url = `https://api.telegram.org/bot${token}/getMe`;

    try {
      // 2. Le decimos a Axios qué tipo de dato va a recibir usando <TelegramGetMeResponse>
      const { data } = await firstValueFrom(
        this.httpService.get<TelegramGetMeResponse>(url, { timeout: 3000 }),
      );

      if (data?.ok && data.result?.username) {
        return this.getStatus(key, true, { bot: data.result.username });
      }

      throw new Error('Telegram API respondió ok=false');
    } catch (error) {
      // 3. Validamos que el error sea una instancia de Error antes de acceder a .message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido de Telegram';

      throw new HealthCheckError(
        'Telegram check failed',
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }
}
