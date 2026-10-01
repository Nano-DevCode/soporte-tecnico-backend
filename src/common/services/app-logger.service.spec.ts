import { AppLoggerService } from './app-logger.service';
import { requestContextStorage } from '../context/request-context';

describe('AppLoggerService', () => {
  let logger: AppLoggerService;
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new AppLoggerService();
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('debería estar definido', () => {
    expect(logger).toBeDefined();
  });

  it('en producción, debería imprimir logs en formato JSON estructurado incluyendo requestId', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      requestContextStorage.run(
        { requestId: 'test-req-12345', userId: 'user-001' },
        () => {
          logger.log('Prueba de log en producción', 'TestContext');
        },
      );

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0]);

      expect(output).toMatchObject({
        level: 'info',
        context: 'TestContext',
        message: 'Prueba de log en producción',
        requestId: 'test-req-12345',
        userId: 'user-001',
      });
      expect(output.timestamp).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('en producción, los errores deben emitirse por stderr en formato JSON con stack trace', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      requestContextStorage.run(
        { requestId: 'test-error-req' },
        () => {
          logger.error('Error fatal', 'Stack trace example', 'ErrorContext');
        },
      );

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(stderrSpy.mock.calls[0][0]);

      expect(output).toMatchObject({
        level: 'error',
        context: 'ErrorContext',
        message: 'Error fatal',
        stack: 'Stack trace example',
        requestId: 'test-error-req',
      });
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
