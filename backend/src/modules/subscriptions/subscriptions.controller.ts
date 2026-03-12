import {
  Controller,
  Get,
  Post,
  Req,
  Headers,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── Static routes BEFORE dynamic routes ────────────────────

  @Get('benefits')
  @ApiOperation({ summary: 'Get VIP benefits list' })
  @ApiResponse({ status: 200, description: 'List of VIP benefits' })
  getVipBenefits() {
    return { data: this.subscriptionsService.getVipBenefits() };
  }

  @Get('me')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription or null' })
  async getMySubscription(@Req() req) {
    const subscription = await this.subscriptionsService.getSubscription(
      req.user.id,
    );
    return { data: subscription };
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get subscription statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription statistics' })
  async getStats() {
    const stats = await this.subscriptionsService.getSubscriptionStats();
    return { data: stats };
  }

  @Post('cancel')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 201, description: 'Subscription cancelled' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async cancelSubscription(@Req() req) {
    const subscription = await this.subscriptionsService.cancelSubscription(
      req.user.id,
    );
    return { data: subscription };
  }

  @Post('webhook/revenuecat')
  @ApiOperation({ summary: 'RevenueCat webhook handler' })
  @ApiResponse({ status: 201, description: 'Webhook processed' })
  @ApiResponse({ status: 401, description: 'Invalid authentication' })
  async handleWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: any,
  ) {
    this.subscriptionsService.validateWebhookAuth(authHeader);
    await this.subscriptionsService.handleRevenueCatWebhook(payload);
    return { data: { received: true } };
  }
}
