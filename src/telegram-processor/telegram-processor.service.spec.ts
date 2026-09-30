import { Test, TestingModule } from '@nestjs/testing';
import { getBotToken } from 'nestjs-telegraf';
import { TelegramError } from 'telegraf';
import { TelegramProcessorService } from './telegram-processor.service';

describe('TelegramProcessorService', () => {
  let processor: TelegramProcessorService;
  let bot: { telegram: { sendMessage: jest.Mock } };

  // Mock básico de un Job de Bull
  const mockJob = {
    id: 'job-123',
    data: {
      chatId: '123456789',
      message: 'Mensaje de prueba',
      options: {
        parse_mode: 'HTML',
      },
    },
  } as unknown as Parameters<TelegramProcessorService['handleNotification']>[0];

  // Función de ayuda para simular un TelegramError real
  const createTelegramError = (code: number, description: string) => {
    return new TelegramError({
      error_code: code,
      description,
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramProcessorService,
        // 👇 Inyectamos el mock del Bot de Telegraf
        {
          provide: getBotToken(),
          useValue: {
            telegram: {
              sendMessage: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    processor = module.get<TelegramProcessorService>(TelegramProcessorService);
    bot = module.get(getBotToken());

    // Silenciamos los logs del logger nativo de Nest para esta instancia
    jest.spyOn(processor['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(processor['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(processor['logger'], 'debug').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  /* ========================================================================
     EVENTOS GLOBALES
  ======================================================================== */
  describe('onGlobalJobFailed', () => {
    it('debe registrar el error global correctamente', () => {
      const error = new Error('Error de prueba');
      processor.onGlobalJobFailed('job-123', error);

      expect(processor['logger'].error).toHaveBeenCalledWith(
        `🚨 ALERTA GLOBAL: Job de Telegram fallido (ID: job-123). Razón: Error: Error de prueba`,
      );
    });
  });

  /* ========================================================================
     PROCESAMIENTO DE NOTIFICACIONES (handleNotification)
  ======================================================================== */
  describe('handleNotification', () => {
    it('debe enviar el mensaje exitosamente y retornar { success: true }', async () => {
      bot.telegram.sendMessage.mockResolvedValue(true);

      const result = await processor.handleNotification(mockJob);

      expect(bot.telegram.sendMessage).toHaveBeenCalledWith(
        '123456789',
        'Mensaje de prueba',
        {
          parse_mode: 'HTML',
        },
      );
      expect(result).toEqual({ success: true });
    });

    // 1. Pruebas de Errores controlados de Telegram (No deben lanzar throw)
    describe('Errores controlados de Telegram', () => {
      it('debe manejar error 409 (Conflicto) y retornar success: false sin lanzar throw', async () => {
        const error409 = createTelegramError(
          409,
          'Conflict: terminated by other getUpdates request',
        );
        bot.telegram.sendMessage.mockRejectedValue(error409);

        const result = await processor.handleNotification(mockJob);

        expect(processor['logger'].error).toHaveBeenCalledWith(
          'Hay un conflicto: Se detectó otra instancia del bot corriendo. Saltando este job.',
        );
        expect(result).toEqual({
          success: false,
          reason: 'Conflict with another instance',
        });
      });

      it('debe manejar error 403 (Bloqueado) y retornar success: false sin lanzar throw', async () => {
        const error403 = createTelegramError(
          403,
          'Forbidden: bot was blocked by the user',
        );
        bot.telegram.sendMessage.mockRejectedValue(error403);

        const result = await processor.handleNotification(mockJob);

        expect(processor['logger'].warn).toHaveBeenCalledWith(
          'El usuario con ID 123456789 ha bloqueado al bot.',
        );
        expect(result).toEqual({ success: false, reason: 'User blocked bot' });
      });
    });

    // 2. Pruebas de errores que SÍ deben lanzar throw (para que Bull reintente)
    describe('Errores que provocan reintento (Throws)', () => {
      it('debe lanzar throw para error 429 (Too Many Requests) para obligar a Bull a reintentar', async () => {
        const error429 = createTelegramError(
          429,
          'Too Many Requests: retry after 33',
        );
        bot.telegram.sendMessage.mockRejectedValue(error429);

        await expect(processor.handleNotification(mockJob)).rejects.toThrow(
          error429,
        );
      });

      it('debe lanzar throw para un Error genérico (ej. caída de internet)', async () => {
        const genericError = new Error('Network timeout');
        bot.telegram.sendMessage.mockRejectedValue(genericError);

        await expect(processor.handleNotification(mockJob)).rejects.toThrow(
          genericError,
        );

        expect(processor['logger'].error).toHaveBeenCalledWith(
          'Error inesperado en TelegramProcessor',
          genericError.stack,
        );
      });

      it('debe envolver y lanzar throw para un error desconocido (no es instancia de Error)', async () => {
        const unknownErrorString = 'Un error super raro en string';
        bot.telegram.sendMessage.mockRejectedValue(unknownErrorString);

        // Validamos que el procesador capture este error extraño y lo convierta en un Error real
        await expect(processor.handleNotification(mockJob)).rejects.toThrow(
          'Unknown error',
        );

        expect(processor['logger'].error).toHaveBeenCalledWith(
          'Se produjo un error desconocido en Telegram',
        );
      });
    });
  });
});
