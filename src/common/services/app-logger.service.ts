import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { RequestContext } from '../context/request-context';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService extends ConsoleLogger {
  private formatStructuredMessage(
    level: string,
    message: unknown,
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
        message:
          typeof message === 'object' && message !== null
            ? message
            : String(message),
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
    const formattedMsg =
      typeof message === 'object' && message !== null
        ? JSON.stringify(message)
        : String(message);
    return `${prefix}${formattedMsg}`;
  }

  override log(message: unknown, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('info', message, context) + '\n',
      );
      return;
    }
    super.log(this.formatStructuredMessage('info', message, context), context);
  }

  override error(message: unknown, stack?: string, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stderr.write(
        this.formatStructuredMessage('error', message, context, stack) + '\n',
      );
      return;
    }
    super.error(
      this.formatStructuredMessage('error', message, context),
      stack,
      context,
    );
  }

  override warn(message: unknown, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('warn', message, context) + '\n',
      );
      return;
    }
    super.warn(this.formatStructuredMessage('warn', message, context), context);
  }

  override debug(message: unknown, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('debug', message, context) + '\n',
      );
      return;
    }
    super.debug(
      this.formatStructuredMessage('debug', message, context),
      context,
    );
  }

  override verbose(message: unknown, context?: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      process.stdout.write(
        this.formatStructuredMessage('verbose', message, context) + '\n',
      );
      return;
    }
    super.verbose(
      this.formatStructuredMessage('verbose', message, context),
      context,
    );
  }
}
