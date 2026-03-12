import { Logger as NestLogger } from '@nestjs/common';
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

// ─────────────────────────────────────────────────────────────
// ANSI helpers
// ─────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// ─────────────────────────────────────────────────────────────
// Known table → human-readable label
// ─────────────────────────────────────────────────────────────
const TABLE_LABELS: Record<string, string> = {
  article: 'Articles',
  articles: 'Articles',
  category: 'Categories',
  categories: 'Categories',
  member: 'Members',
  members: 'Members',
  ticker_item: 'Ticker',
  ticker_items: 'Ticker',
  user_favorite: 'Favorites',
  user_favorites: 'Favorites',
  reading_history: 'History',
  reading_histories: 'History',
  comment: 'Comments',
  comments: 'Comments',
  author: 'Authors',
  authors: 'Authors',
  tag: 'Tags',
  tags: 'Tags',
  story: 'Stories',
  stories: 'Stories',
  media: 'Media',
  app_user: 'AppUsers',
  app_users: 'AppUsers',
  push_token: 'PushTokens',
  push_tokens: 'PushTokens',
  contact_message: 'Contact',
  contact_messages: 'Contact',
  primary_election: 'Elections',
  primary_elections: 'Elections',
  candidate: 'Candidates',
  candidates: 'Candidates',
  candidate_endorsement: 'Endorsements',
  candidate_endorsements: 'Endorsements',
  quiz_question: 'Quiz',
  quiz_questions: 'Quiz',
  quiz_response: 'QuizResponses',
  quiz_responses: 'QuizResponses',
  campaign_event: 'Events',
  campaign_events: 'Events',
  event_rsvp: 'RSVPs',
  event_rsvps: 'RSVPs',
  user_points: 'Gamification',
  user_badge: 'Badges',
  user_badges: 'Badges',
  polling_station: 'Stations',
  polling_stations: 'Stations',
  station_report: 'Reports',
  station_reports: 'Reports',
  election_result: 'Results',
  election_results: 'Results',
  turnout_snapshot: 'Turnout',
  turnout_snapshots: 'Turnout',
  community_poll: 'Polls',
  community_polls: 'Polls',
  poll_vote: 'Votes',
  poll_votes: 'Votes',
  bookmark_folder: 'Bookmarks',
  bookmark_folders: 'Bookmarks',
  user_follow: 'Follows',
  user_follows: 'Follows',
};

// ─────────────────────────────────────────────────────────────
// Detect operation type from SQL
// ─────────────────────────────────────────────────────────────
function detectOperation(sql: string): { op: string; color: string } {
  const upper = sql.trimStart().toUpperCase();
  if (upper.startsWith('SELECT')) return { op: 'SELECT', color: c.cyan };
  if (upper.startsWith('INSERT')) return { op: 'INSERT', color: c.green };
  if (upper.startsWith('UPDATE')) return { op: 'UPDATE', color: c.yellow };
  if (upper.startsWith('DELETE')) return { op: 'DELETE', color: c.red };
  if (upper.startsWith('CREATE')) return { op: 'CREATE', color: c.magenta };
  if (upper.startsWith('ALTER')) return { op: 'ALTER', color: c.magenta };
  if (upper.startsWith('DROP')) return { op: 'DROP', color: c.red };
  if (upper.startsWith('BEGIN') || upper.startsWith('START'))
    return { op: 'TXN:BEGIN', color: c.blue };
  if (upper.startsWith('COMMIT')) return { op: 'TXN:COMMIT', color: c.blue };
  if (upper.startsWith('ROLLBACK')) return { op: 'TXN:ROLLBACK', color: c.red };
  return { op: 'QUERY', color: c.gray };
}

// ─────────────────────────────────────────────────────────────
// Extract table name from SQL
// ─────────────────────────────────────────────────────────────
function extractTable(sql: string): string {
  // FROM "table_name" or INTO "table_name" or UPDATE "table_name"
  const match = sql.match(/(?:FROM|INTO|UPDATE|JOIN|TABLE)\s+"?(\w+)"?/i);
  if (match) {
    const raw = match[1];
    return TABLE_LABELS[raw] || raw;
  }
  return '';
}

// ─────────────────────────────────────────────────────────────
// Format params for display
// ─────────────────────────────────────────────────────────────
function formatParams(params?: any[]): string {
  if (!params || params.length === 0) return '';
  const formatted = params.map((p) => {
    if (p === null || p === undefined) return 'NULL';
    if (typeof p === 'string') {
      return p.length > 40 ? `"${p.slice(0, 37)}..."` : `"${p}"`;
    }
    return String(p);
  });
  return formatted.join(', ');
}

// ─────────────────────────────────────────────────────────────
// Duration formatting
// ─────────────────────────────────────────────────────────────
function durationStr(ms: number): string {
  if (ms < 10) return `${c.green}${ms}ms${c.reset}`;
  if (ms < 100) return `${c.yellow}${ms}ms${c.reset}`;
  return `${c.red}${ms}ms${c.reset}`;
}

/**
 * Custom TypeORM logger that outputs concise, readable query logs.
 *
 * Example output:
 *   🗄  SELECT  Articles  (3ms)  params: ["slug-value"]
 *   🗄  INSERT  History   (1ms)  params: ["device-123", "article-456"]
 *   🗄  UPDATE  Favorites (2ms)  params: [true, "device-789"]
 */
export class ReadableTypeOrmLogger implements TypeOrmLogger {
  private readonly logger = new NestLogger('DB');

  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    // Skip internal TypeORM metadata queries
    if (query.includes('pg_catalog') || query.includes('information_schema')) {
      return;
    }

    const { op, color } = detectOperation(query);
    const table = extractTable(query);
    const params = formatParams(parameters);
    const tableStr = table ? `  ${c.bold}${table}${c.reset}` : '';
    const paramStr = params ? `  ${c.dim}params: [${params}]${c.reset}` : '';

    this.logger.debug(
      `${color}${op.padEnd(11)}${c.reset}${tableStr}${paramStr}`,
    );
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    const { op, color: _color } = detectOperation(query);
    const table = extractTable(query);
    const params = formatParams(parameters);
    const errMsg = typeof error === 'string' ? error : error.message;
    const tableStr = table ? ` ${c.bold}${table}${c.reset}` : '';
    const paramStr = params ? `  params: [${params}]` : '';

    this.logger.error(
      `${c.red}${op.padEnd(11)} FAILED${c.reset}${tableStr}${paramStr}\n${c.red}           ${errMsg}${c.reset}`,
    );
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    const { op } = detectOperation(query);
    const table = extractTable(query);
    const params = formatParams(parameters);
    const tableStr = table ? ` ${c.bold}${table}${c.reset}` : '';
    const paramStr = params ? `  params: [${params}]` : '';

    this.logger.warn(
      `${c.red}SLOW ${op.padEnd(7)}${c.reset}${tableStr}  ${durationStr(time)}${paramStr}`,
    );
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    this.logger.log(`${c.magenta}Schema${c.reset}  ${message}`);
  }

  logMigration(message: string, _queryRunner?: QueryRunner) {
    this.logger.log(`${c.blue}Migration${c.reset}  ${message}`);
  }

  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    _queryRunner?: QueryRunner,
  ) {
    switch (level) {
      case 'warn':
        this.logger.warn(message);
        break;
      default:
        this.logger.log(message);
        break;
    }
  }
}
