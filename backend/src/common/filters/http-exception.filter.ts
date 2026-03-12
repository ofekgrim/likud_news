import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// ─────────────────────────────────────────────────────────────
// ANSI helpers
// ─────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

/**
 * Global exception filter that logs every error in a readable format
 * and returns a consistent JSON shape to the client.
 *
 * Example output:
 *   ┌─ 404 NOT FOUND ──────────────────────────
 *   │  POST /history
 *   │  Article with ID "abc" not found
 *   │  IP: ::1  UA: Flutter/3.x
 *   └───────────────────────────────────────────
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    // ── Extract status & message ─────────────────────────────
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorName = 'InternalServerError';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      errorName = exception.name || HttpException.name;

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const resp = response as Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message = resp.message || exception.message;
        // Validation errors come as array of messages
        if (Array.isArray(resp.message)) {
          details = resp.message;
          message = resp.message.join('; ');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name || 'Error';
    }

    // ── Build readable log output ────────────────────────────
    const method = req.method;
    const url = req.originalUrl?.replace(/^\/api\/v1/, '') || req.url;
    const ip = req.ip?.replace('::ffff:', '') || '?';
    const ua = req.get('user-agent') || '-';
    const clientHint = ua.includes('Flutter')
      ? 'Flutter'
      : ua.includes('Next') || ua.includes('node')
        ? 'Admin'
        : 'Browser';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    const isServer = status >= 500;
    const badge = isServer
      ? `${c.bgRed}${c.bold}${c.white} ${status} ${errorName} ${c.reset}`
      : `${c.bgYellow}${c.bold}${c.white} ${status} ${errorName} ${c.reset}`;

    const border = isServer ? c.red : c.yellow;

    let log = '';
    log += `\n${border}  ┌─ ${c.reset}${badge}\n`;
    log += `${border}  │${c.reset}  ${method} ${c.white}${url}${c.reset}\n`;
    log += `${border}  │${c.reset}  ${isServer ? c.red : c.yellow}${message}${c.reset}\n`;
    if (details) {
      for (const d of details) {
        log += `${border}  │${c.reset}  ${c.dim}  - ${d}${c.reset}\n`;
      }
    }
    log += `${border}  │${c.reset}  ${c.dim}IP: ${ip}  Client: ${clientHint}${c.reset}\n`;

    // Stack trace only for 5xx
    if (isServer && exception instanceof Error && exception.stack) {
      const stackLines = exception.stack.split('\n').slice(1, 4);
      for (const line of stackLines) {
        log += `${border}  │${c.reset}  ${c.dim}${line.trim()}${c.reset}\n`;
      }
    }

    log += `${border}  └${'─'.repeat(45)}${c.reset}`;

    if (isServer) {
      this.logger.error(log);
    } else {
      this.logger.warn(log);
    }

    // ── Send response ────────────────────────────────────────
    res.status(status).json({
      statusCode: status,
      message,
      error: errorName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
}
