import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import {
  TelegramBotService,
  TelegramNotificationOptions,
} from './telegram-bot.service';

describe('TelegramBotService', () => {
  let service: TelegramBotService;
  let telegramQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramBotService,
        // 👇 Así se hace el mock de un @InjectQueue en NestJS
        {
          provide: getQueueToken('telegram-queue'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TelegramBotService>(TelegramBotService);
    telegramQueue = module.get(getQueueToken('telegram-queue'));

    // Silenciamos el logger específicamente para esta instancia para evitar logs rojos en las pruebas de error
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});

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
        inline_keyboard: [
          [{ text: 'Abrir Sistema', url: 'https://ejemplo.com' }],
        ],
      },
    };

    it('debe agregar el trabajo a la cola y retornar éxito', async () => {
      // Simulamos que Bull nos responde con un trabajo que contiene un ID generado
      const mockJob = { id: 999 };
      telegramQueue.add.mockResolvedValue(mockJob as Job);

      const result = await service.sendNotification(chatId, message, options);

      // 1. Validamos que el trabajo se haya añadido a la cola con los parámetros exactos
      expect(telegramQueue.add).toHaveBeenCalledWith(
        'enviar-notificacion', // El nombre del job
        { chatId, message, options }, // La data (payload)
        {
          attempts: 3,
          backoff: 5000,
          removeOnComplete: true,
          removeOnFail: false,
        }, // Las opciones de reintento
      );

      // 2. Validamos que el logger haya registrado el éxito
      expect(service['logger'].log).toHaveBeenCalledWith(
        'Notificación encolada para 123456789 (Job ID: 999)',
      );

      // 3. Validamos la respuesta que se enviará al controlador
      expect(result).toEqual({
        success: true,
        message: 'Notificación encolada correctamente',
        jobId: 999,
      });
    });

    it('debe manejar errores de la cola y retornar success: false sin detener la aplicación', async () => {
      // Simulamos que Redis está caído o la cola falla al guardar
      const queueError = new Error('Redis connection failed');
      telegramQueue.add.mockRejectedValue(queueError);

      const result = await service.sendNotification(chatId, message);

      // 1. Validamos que intentó agregarlo
      expect(telegramQueue.add).toHaveBeenCalled();

      // 2. Validamos que el error se registró en el logger
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error al encolar la notificación de Telegram',
        queueError,
      );

      // 3. Validamos que devuelve un mensaje de error limpio al usuario
      expect(result).toEqual({
        success: false,
        error: 'No se pudo procesar la solicitud (Error interno de cola)',
      });
    });
  });
});
