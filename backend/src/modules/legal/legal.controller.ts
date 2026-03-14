import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('legal')
@Controller('legal')
@SkipThrottle()
export class LegalController {
  private readonly privacyHtml: string;

  constructor() {
    this.privacyHtml = readFileSync(
      join(__dirname, 'privacy-policy.html'),
      'utf-8',
    );
  }

  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=86400')
  privacyPolicy(): string {
    return this.privacyHtml;
  }
}
