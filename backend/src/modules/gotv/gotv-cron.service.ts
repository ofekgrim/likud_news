import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GotvPushService } from './gotv-push.service';

@Injectable()
export class GotvCronService {
  private readonly logger = new Logger(GotvCronService.name);

  constructor(private readonly gotvPushService: GotvPushService) {}

  /**
   * Pre-election reminders — runs daily at 10:00 AM Israel time.
   * Checks days until election and triggers 7d, 3d, or 1d reminders.
   */
  @Cron('0 10 * * *', { timeZone: 'Asia/Jerusalem' })
  async handlePreElectionReminders(): Promise<void> {
    const election = await this.gotvPushService.getActiveElection();
    if (!election || !election.electionDate) {
      return;
    }

    const daysUntil = this.differenceInDays(election.electionDate, new Date());

    if (daysUntil === 7) {
      this.logger.log('Triggering 7-day pre-election reminder');
      await this.gotvPushService.sendPreElectionReminder(7);
    }

    if (daysUntil === 3) {
      this.logger.log('Triggering 3-day pre-election reminder');
      await this.gotvPushService.sendPreElectionReminder(3);
    }

    if (daysUntil === 1) {
      this.logger.log('Triggering 1-day pre-election reminder');
      await this.gotvPushService.sendPreElectionReminder(1);
    }
  }

  /**
   * Election day morning — runs at 7:30 AM Israel time.
   * Polls open notification to all eligible members.
   */
  @Cron('30 7 * * *', { timeZone: 'Asia/Jerusalem' })
  async handleElectionDayMorning(): Promise<void> {
    const election = await this.gotvPushService.getActiveElection();
    if (!election || !this.isElectionDay(election)) {
      return;
    }

    this.logger.log('Triggering election day morning push');
    await this.gotvPushService.sendElectionDayMorning(election.id);
  }

  /**
   * Election day midday — runs at 12:00 PM Israel time.
   * Turnout update for non-voters.
   */
  @Cron('0 12 * * *', { timeZone: 'Asia/Jerusalem' })
  async handleElectionDayMidday(): Promise<void> {
    const election = await this.gotvPushService.getActiveElection();
    if (!election || !this.isElectionDay(election)) {
      return;
    }

    this.logger.log('Triggering election day midday push');
    await this.gotvPushService.sendElectionDayMidday(election.id);
  }

  /**
   * Election day final push — runs at 4:30 PM Israel time.
   * High urgency for non-voters.
   */
  @Cron('30 16 * * *', { timeZone: 'Asia/Jerusalem' })
  async handleElectionDayFinal(): Promise<void> {
    const election = await this.gotvPushService.getActiveElection();
    if (!election || !this.isElectionDay(election)) {
      return;
    }

    this.logger.log('Triggering election day final push');
    await this.gotvPushService.sendElectionDayFinal(election.id);
  }

  // ─── Private helpers ───────────────────────────────────────

  /**
   * Calculate the difference in calendar days between two dates.
   * Returns positive if target is in the future.
   */
  differenceInDays(target: Date, from: Date): number {
    const targetDate = new Date(target);
    const fromDate = new Date(from);

    // Normalize to start of day (midnight) for calendar day comparison
    targetDate.setHours(0, 0, 0, 0);
    fromDate.setHours(0, 0, 0, 0);

    const diffMs = targetDate.getTime() - fromDate.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if today is the election day.
   */
  private isElectionDay(election: { electionDate?: Date }): boolean {
    if (!election.electionDate) return false;
    return this.differenceInDays(election.electionDate, new Date()) === 0;
  }
}
