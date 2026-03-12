import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

// ─────────────────────────────────────────────────────────────
// ANSI color helpers (no dependencies needed)
// ─────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  // Foreground
  white: '\x1b[37m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  // Background
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// ─────────────────────────────────────────────────────────────
// Method badge (colored background)
// ─────────────────────────────────────────────────────────────
function methodBadge(method: string): string {
  const pad = method.padEnd(7);
  switch (method) {
    case 'GET':
      return `${c.bgGreen}${c.bold}${c.white} ${pad}${c.reset}`;
    case 'POST':
      return `${c.bgBlue}${c.bold}${c.white} ${pad}${c.reset}`;
    case 'PUT':
      return `${c.bgYellow}${c.bold}${c.white} ${pad}${c.reset}`;
    case 'PATCH':
      return `${c.bgMagenta}${c.bold}${c.white} ${pad}${c.reset}`;
    case 'DELETE':
      return `${c.bgRed}${c.bold}${c.white} ${pad}${c.reset}`;
    default:
      return `${c.bgCyan}${c.bold}${c.white} ${pad}${c.reset}`;
  }
}

// ─────────────────────────────────────────────────────────────
// Status badge (colored number)
// ─────────────────────────────────────────────────────────────
function statusColor(status: number): string {
  if (status < 300) return `${c.green}${status}${c.reset}`;
  if (status < 400) return `${c.cyan}${status}${c.reset}`;
  if (status < 500) return `${c.yellow}${status}${c.reset}`;
  return `${c.red}${status}${c.reset}`;
}

// ─────────────────────────────────────────────────────────────
// Duration badge
// ─────────────────────────────────────────────────────────────
function durationColor(ms: number): string {
  if (ms < 50) return `${c.green}${ms}ms${c.reset}`;
  if (ms < 200) return `${c.yellow}${ms}ms${c.reset}`;
  return `${c.red}${ms}ms${c.reset}`;
}

// ─────────────────────────────────────────────────────────────
// Strip /api/v1 prefix for cleaner display
// ─────────────────────────────────────────────────────────────
function cleanPath(url: string): string {
  return url.replace(/^\/api\/v1/, '');
}

// ─────────────────────────────────────────────────────────────
// Format body for display (truncate long values)
// ─────────────────────────────────────────────────────────────
function formatBody(body: Record<string, any>): string {
  if (!body || Object.keys(body).length === 0) return '';
  const entries = Object.entries(body).map(([k, v]) => {
    if (typeof v === 'string' && v.length > 60) {
      return `${k}: "${v.slice(0, 57)}..."`;
    }
    if (typeof v === 'object' && v !== null) {
      const str = JSON.stringify(v);
      return str.length > 60 ? `${k}: ${str.slice(0, 57)}...` : `${k}: ${str}`;
    }
    return `${k}: ${JSON.stringify(v)}`;
  });
  return entries.join(', ');
}

// ─────────────────────────────────────────────────────────────
// Format query params
// ─────────────────────────────────────────────────────────────
function formatQuery(query: Record<string, any>): string {
  if (!query || Object.keys(query).length === 0) return '';
  return Object.entries(query)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { method, originalUrl, body, query } = req;
    const start = Date.now();

    // Identify client type from User-Agent
    const ua = req.get('user-agent') || '';
    let client = '';
    if (ua.includes('Flutter')) client = `${c.magenta}[Flutter]${c.reset} `;
    else if (ua.includes('Next') || ua.includes('node'))
      client = `${c.cyan}[Admin]${c.reset} `;
    else if (ua.includes('Mozilla') || ua.includes('Chrome'))
      client = `${c.blue}[Browser]${c.reset} `;

    // Auth info
    const authHeader = req.get('authorization');
    const authTag = authHeader
      ? `${c.green} [Auth]${c.reset}`
      : `${c.dim} [Anon]${c.reset}`;

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = res.statusCode;
          const path = cleanPath(originalUrl);
          const queryStr = formatQuery(query as Record<string, any>);
          const bodyStr =
            method !== 'GET' && body && Object.keys(body).length
              ? formatBody(body)
              : '';

          // ┌──────────────────────────────────────────────────────
          // │  GET     /articles/slug-name → 200 (12ms)  [Flutter] [Anon]
          // │          ?page=1&limit=10
          // │          body: { title: "...", content: "..." }
          // └──────────────────────────────────────────────────────
          let line = `${methodBadge(method)} ${c.white}${path}${c.reset} → ${statusColor(status)} ${c.dim}(${c.reset}${durationColor(ms)}${c.dim})${c.reset}  ${client}${authTag}`;
          if (queryStr) line += `\n${c.dim}           ? ${queryStr}${c.reset}`;
          if (bodyStr)
            line += `\n${c.dim}           body: { ${bodyStr} }${c.reset}`;

          this.logger.log(line);
        },

        error: (err: any) => {
          const ms = Date.now() - start;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          const status = err?.status || err?.getStatus?.() || 500;
          const path = cleanPath(originalUrl);
          const queryStr = formatQuery(query as Record<string, any>);
          const bodyStr =
            method !== 'GET' && body && Object.keys(body).length
              ? formatBody(body)
              : '';

          let line = `${methodBadge(method)} ${c.white}${path}${c.reset} → ${statusColor(status)} ${c.dim}(${c.reset}${durationColor(ms)}${c.dim})${c.reset}  ${client}${authTag}`;
          if (queryStr) line += `\n${c.dim}           ? ${queryStr}${c.reset}`;
          if (bodyStr)
            line += `\n${c.dim}           body: { ${bodyStr} }${c.reset}`;

          /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
          const errMsg =
            err?.message ||
            (err?.response?.message as string) ||
            'Unknown error';
          /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
          line += `\n${c.red}           error: ${errMsg}${c.reset}`;

          if (status >= 500) {
            this.logger.error(line);
          } else {
            this.logger.warn(line);
          }
        },
      }),
    );
  }
}
