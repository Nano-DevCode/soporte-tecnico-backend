import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { GmailService } from './gmail.service';

describe('GmailService', () => {
  let service: GmailService;
  let emailQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailService,
        {
          provide: getQueueToken('email-queue'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GmailService>(GmailService);
    emailQueue = module.get(getQueueToken('email-queue'));

    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
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

    it('debe rechazar un destinatario vacío o inválido sin agregar a la cola', async () => {
      const result = await service.sendEmail('   ', asunto, mensaje);

      expect(result).toEqual({
        success: false,
        error: 'Destinatario de correo inválido',
      });
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('debe agregar el trabajo a la cola y retornar éxito inmediatamente', async () => {
      const mockJob = { id: 'email-job-456' } as Job;
      emailQueue.add.mockResolvedValue(mockJob);

      const result = await service.sendEmail(destinatario, asunto, mensaje);

      expect(emailQueue.add).toHaveBeenCalledWith(
        'enviar-correo',
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
        },
      );

      expect(service['logger'].log).toHaveBeenCalledWith(
        `Trabajo de correo encolado con ID: email-job-456 destinatario: destinatario.test@ejemplo.com`,
      );

      expect(result).toEqual({
        success: true,
        message: 'Correo encolado para envío',
        jobId: 'email-job-456',
      });
    });

    it('debe manejar errores al encolar (ej. Redis caído) y retornar success: false', async () => {
      const queueError = new Error('No se pudo conectar a Redis');
      emailQueue.add.mockRejectedValue(queueError);

      const result = await service.sendEmail(destinatario, asunto, mensaje);

      expect(emailQueue.add).toHaveBeenCalled();
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error al encolar el correo',
        queueError,
      );
      expect(result).toEqual({
        success: false,
        error: 'No se pudo encolar el correo',
      });
    });
  });
});
