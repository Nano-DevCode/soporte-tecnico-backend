import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import type { Job } from 'bull';
import { GmailProcessorService } from './gmail-processor.service';
import { notificationTemplate } from './template/email.template';

describe('GmailProcessorService', () => {
  let processor: GmailProcessorService;
  let mailerService: jest.Mocked<MailerService>;

  // Definimos la interfaz localmente para construir los errores simulados
  interface MailError extends Error {
    code?: string | number;
    responseCode?: number;
  }

  // Mock básico de un Job de Bull para correos
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
        GmailProcessorService,
        // 👇 Inyectamos el mock del MailerService
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<GmailProcessorService>(GmailProcessorService);
    mailerService = module.get(MailerService);

    // Silenciamos los logs del logger nativo de Nest para esta instancia
    jest.spyOn(processor['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(processor['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(processor['logger'], 'log').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  /* ========================================================================
     EVENTOS DE COLA (OnQueueCompleted / OnQueueFailed)
  ======================================================================== */
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

  /* ========================================================================
     PROCESAMIENTO DE ENVÍO (handleEnvio)
  ======================================================================== */
  describe('handleEnvio', () => {
    it('debe enviar el correo exitosamente y retornar { success: true }', async () => {
      mailerService.sendMail.mockResolvedValue(true);

      const result = await processor.handleEnvio(mockJob);

      // Verificamos que se llame al servicio de correo con los datos correctos y el HTML compilado
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: mockJobData.destinatario,
        subject: mockJobData.asunto,
        html: notificationTemplate(mockJobData.mensaje),
      });

      expect(result).toEqual({ success: true });
    });

    // Pruebas de errores específicos de SMTP
    describe('Manejo de errores SMTP', () => {
      it('debe advertir sobre fallo de autenticación (EAUTH / 535) y re-lanzar error', async () => {
        const authError = new Error('Invalid login') as MailError;
        authError.code = 'EAUTH';

        mailerService.sendMail.mockRejectedValue(authError);

        await expect(processor.handleEnvio(mockJob)).rejects.toThrow(
          'Invalid login',
        );

        expect(processor['logger'].warn).toHaveBeenCalledWith(
          'Fallo de autenticación: Verifica la contraseña de aplicación.',
        );
        expect(processor['logger'].error).toHaveBeenCalledWith(
          'Error de SMTP/Gmail [EAUTH]: Invalid login',
        );
      });

      it('debe advertir sobre destinatario inválido (EENVELOPE / 550) y re-lanzar error', async () => {
        const envelopeError = new Error('Mailbox unavailable') as MailError;
        envelopeError.responseCode = 550;

        mailerService.sendMail.mockRejectedValue(envelopeError);

        await expect(processor.handleEnvio(mockJob)).rejects.toThrow(
          'Mailbox unavailable',
        );

        expect(processor['logger'].warn).toHaveBeenCalledWith(
          'El destinatario destinatario.test@ejemplo.com no es válido.',
        );
      });
    });

    // Pruebas de errores generales
    describe('Manejo de errores generales', () => {
      it('debe capturar un Error genérico (ej. Timeout) y re-lanzarlo', async () => {
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

      it('debe manejar un error de tipo desconocido y lanzar un Error genérico', async () => {
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
