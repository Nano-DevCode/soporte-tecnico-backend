import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { RequestContext } from '../context/request-context';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService extends ConsoleLogger {
  private formatStructuredMessage(
    level: string,
    message: any,
    context?: string,
    stack?: string,
  ): string {
    const requestId = RequestContext.getRequestId();
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      const payload: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level,
        context: context || this.context || 'Application',
        message: typeof message === 'object' ? message : String(message),
      };

      if (requestId) {
        payload.requestId = requestId;
      }

      const userId = RequestContext.getUserId();
      if (userId) {
        payload.userId = userId;
      }

      if (stack) {
        payload.stack = stack;
      }

      return JSON.stringify(payload);
    }

    const prefix = requestId ? `[${requestId.slice(0, 8)}] ` : '';
    return `${prefix}${typeof message === 'object' ? JSON.stringify(message) : message}`;
  }

  override log(message: any, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('info', message, context) + '\n',
      );
      return;
    }
    super.log(this.formatStructuredMessage('info', message, context), context);
  }

  override error(message: any, stack?: string, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stderr.write(
        this.formatStructuredMessage('error', message, context, stack) + '\n',
      );
      return;
    }
    super.error(this.formatStructuredMessage('error', message, context), stack, context);
  }

  override warn(message: any, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('warn', message, context) + '\n',
      );
      return;
    }
    super.warn(this.formatStructuredMessage('warn', message, context), context);
  }

  override debug(message: any, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('debug', message, context) + '\n',
      );
      return;
    }
    super.debug(this.formatStructuredMessage('debug', message, context), context);
  }

  override verbose(message: any, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('verbose', message, context) + '\n',
      );
      return;
    }
    super.verbose(this.formatStructuredMessage('verbose', message, context), context);
  }
}
