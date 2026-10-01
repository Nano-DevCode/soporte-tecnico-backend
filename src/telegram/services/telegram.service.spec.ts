import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import {
  TelegramService,
  TelegramNotificationOptions,
} from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let telegramQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: getQueueToken('telegram-queue'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    telegramQueue = module.get(getQueueToken('telegram-queue'));

    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    const chatId = '123456789';
    const message = 'Hola, este es un mensaje de prueba';
    const options: TelegramNotificationOptions = {
      reply_markup: {
        inline_keyboard: [[{ text: 'Ver Ticket', url: 'https://test.com' }]],
      },
    };

    it('debe rechazar chatIds inválidos o de menos de 4 caracteres sin llamar a la cola', async () => {
      const result = await service.sendNotification('12', message);

      expect(result).toEqual({
        success: false,
        error:
          'No se puede encolar la notificación porque el chatId es inválido o menor a 4 caracteres',
      });
      expect(telegramQueue.add).not.toHaveBeenCalled();
      expect(service['logger'].warn).toHaveBeenCalled();
    });

    it('debe agregar el trabajo a la cola y retornar éxito inmediatamente', async () => {
      const mockJob = { id: 'job-123' } as Job;
      telegramQueue.add.mockResolvedValue(mockJob);

      const result = await service.sendNotification(chatId, message, options);

      expect(telegramQueue.add).toHaveBeenCalledWith(
        'enviar-notificacion',
        {
          chatId,
          message,
          options,
        },
        {
          attempts: 3,
          backoff: 5000,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      expect(service['logger'].log).toHaveBeenCalledWith(
        `Notificación encolada para ${chatId} (Job ID: job-123)`,
      );

      expect(result).toEqual({
        success: true,
        message: 'Notificación encolada correctamente',
        jobId: 'job-123',
      });
    });

    it('debe manejar errores de la cola y retornar success: false de manera segura', async () => {
      const queueError = new Error('Conexión perdida con Redis');
      telegramQueue.add.mockRejectedValue(queueError);

      const result = await service.sendNotification(chatId, message);

      expect(telegramQueue.add).toHaveBeenCalled();
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error al encolar la notificación de Telegram',
        queueError,
      );

      expect(result).toEqual({
        success: false,
        error: 'No se pudo procesar la solicitud (Error interno de cola)',
      });
    });
  });
});
