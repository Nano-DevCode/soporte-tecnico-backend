import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import type { Job } from 'bull';
import { GmailProcessor } from './gmail.processor';
import { notificationTemplate } from '../templates/email.template';
import { MailError } from '../interfaces/email-job.interface';

describe('GmailProcessor', () => {
  let processor: GmailProcessor;
  let mailerService: jest.Mocked<MailerService>;

  const mockJobData = {
    destinatario: 'destinatario.test@ejemplo.com',
    asunto: 'Notificación del Sistema',
    mensaje: 'Este es un mensaje de prueba para el sistema de tickets.',
  };

  const mockJob = {
    id: 'job-email-123',
    data: mockJobData,
  } as unknown as Job<typeof mockJobData>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailProcessor,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<GmailProcessor>(GmailProcessor);
    mailerService = module.get(MailerService);

    jest.spyOn(processor['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(processor['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(processor['logger'], 'log').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('Eventos de Cola', () => {
    it('debe registrar el éxito cuando un trabajo se completa (onCompleted)', () => {
      processor.onCompleted(mockJob);

      expect(processor['logger'].log).toHaveBeenCalledWith(
        `[Job job-email-123] Correo enviado a destinatario.test@ejemplo.com`,
      );
    });

    it('debe registrar el error cuando un trabajo falla (onFailed)', () => {
      const error = new Error('Conexión rechazada');
      processor.onFailed(mockJob, error);

      expect(processor['logger'].error).toHaveBeenCalledWith(
        `[Job job-email-123] Falló en la cola para destinatario.test@ejemplo.com. Razón: Conexión rechazada`,
      );
    });
  });

  describe('handleEnvio', () => {
    it('debe enviar el correo exitosamente y retornar { success: true }', async () => {
      mailerService.sendMail.mockResolvedValue(true);

      const result = await processor.handleEnvio(mockJob);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: mockJobData.destinatario,
        subject: mockJobData.asunto,
        html: notificationTemplate(mockJobData.mensaje),
      });

      expect(result).toEqual({ success: true });
    });

    describe('Manejo de errores SMTP terminales vs reintentables', () => {
      it('debe tratar fallo de autenticación (EAUTH / 535) como error terminal sin lanzar excepción', async () => {
        const authError = new Error('Invalid login') as MailError;
        authError.code = 'EAUTH';

        mailerService.sendMail.mockRejectedValue(authError);

        const result = await processor.handleEnvio(mockJob);

        expect(processor['logger'].warn).toHaveBeenCalledWith(
          'Fallo de autenticación: Verifica la contraseña de aplicación.',
        );
        expect(result).toEqual({
          success: false,
          reason: 'Authentication failure (EAUTH/535)',
        });
      });

      it('debe tratar destinatario inválido (EENVELOPE / 550) como error terminal sin lanzar excepción', async () => {
        const envelopeError = new Error('Mailbox unavailable') as MailError;
        envelopeError.responseCode = 550;

        mailerService.sendMail.mockRejectedValue(envelopeError);

        const result = await processor.handleEnvio(mockJob);

        expect(processor['logger'].warn).toHaveBeenCalledWith(
          `El destinatario ${mockJobData.destinatario} no es válido.`,
        );
        expect(result).toEqual({
          success: false,
          reason: `Invalid recipient (EENVELOPE/550): ${mockJobData.destinatario}`,
        });
      });

      it('debe relanzar errores SMTP transitorios para que Bull reintente', async () => {
        const transientError = new Error('Service unavailable') as MailError;
        transientError.code = 'ETIMEDOUT';

        mailerService.sendMail.mockRejectedValue(transientError);

        await expect(processor.handleEnvio(mockJob)).rejects.toThrow(
          'Service unavailable',
        );
      });
    });

    describe('Manejo de errores generales', () => {
      it('debe capturar un Error genérico y re-lanzarlo para reintento', async () => {
        const genericError = new Error('Connection timeout');
        mailerService.sendMail.mockRejectedValue(genericError);

        await expect(processor.handleEnvio(mockJob)).rejects.toThrow(
          genericError,
        );

        expect(processor['logger'].error).toHaveBeenCalledWith(
          'Error inesperado en GmailProcessor',
          genericError.stack,
        );
      });

      it('debe manejar un error no tipado como Error genérico y re-lanzarlo', async () => {
        const unknownErrorString = 'Error interno del servidor de correos';
        mailerService.sendMail.mockRejectedValue(unknownErrorString);

        await expect(processor.handleEnvio(mockJob)).rejects.toThrow(
          'Unknown error',
        );

        expect(processor['logger'].error).toHaveBeenCalledWith(
          'Se produjo un error desconocido al enviar correo',
        );
      });
    });
  });
});
