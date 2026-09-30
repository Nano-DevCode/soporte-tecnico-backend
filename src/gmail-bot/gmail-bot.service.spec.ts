import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { GmailBotService } from './gmail-bot.service';

describe('GmailBotService', () => {
  let service: GmailBotService;
  let emailQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailBotService,
        // 👇 Hacemos el mock de la cola de Bull para 'email-queue'
        {
          provide: getQueueToken('email-queue'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GmailBotService>(GmailBotService);
    emailQueue = module.get(getQueueToken('email-queue'));

    // Silenciamos el logger nativo para esta instancia
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    const destinatario = 'destinatario.test@ejemplo.com';
    const asunto = 'Notificación Importante';
    const mensaje = 'Este es el cuerpo del correo.';

    it('debe agregar el trabajo a la cola y retornar éxito inmediatamente', async () => {
      // Simulamos que Bull nos responde exitosamente con un Job ID
      const mockJob = { id: 'email-job-456' } as Job;
      emailQueue.add.mockResolvedValue(mockJob);

      const result = await service.sendEmail(destinatario, asunto, mensaje);

      // 1. Validamos que el trabajo se haya añadido a la cola con los parámetros exactos
      expect(emailQueue.add).toHaveBeenCalledWith(
        'enviar-correo', // Nombre del Job
        {
          destinatario,
          asunto,
          mensaje,
        },
        {
          attempts: 3,
          backoff: 5000,
          removeOnComplete: true,
          removeOnFail: false,
        }, // Opciones de reintento configuradas en tu código
      );

      // 2. Validamos que el logger haya registrado el éxito
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Trabajo de correo encolado con ID: email-job-456 destinatario: destinatario.test@ejemplo.com`,
      );

      // 3. Validamos que se retorne la respuesta exitosa al controlador
      expect(result).toEqual({
        success: true,
        message: 'Correo encolado para envío',
        jobId: 'email-job-456',
      });
    });

    it('debe manejar errores al encolar (ej. Redis caído) y retornar success: false', async () => {
      // Simulamos una falla en Redis o en la librería Bull
      const queueError = new Error('No se pudo conectar a Redis');
      emailQueue.add.mockRejectedValue(queueError);

      const result = await service.sendEmail(destinatario, asunto, mensaje);

      // 1. Validamos que se intentó agregar
      expect(emailQueue.add).toHaveBeenCalled();

      // 2. Validamos que el error se capturó y registró
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error al encolar el correo',
        queueError,
      );

      // 3. Validamos que el sistema responde de forma segura al usuario
      expect(result).toEqual({
        success: false,
        error: 'No se pudo encolar el correo',
      });
    });
  });
});
