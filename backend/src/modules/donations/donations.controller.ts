import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { ConfirmDonationDto } from './dto/confirm-donation.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // ─── Public (auth required) ──────────────────────────────

  @Get('eligibility')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Check donation eligibility and remaining caps' })
  @ApiQuery({ name: 'recipientType', required: true, enum: ['candidate', 'party'] })
  @ApiQuery({ name: 'recipientCandidateId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Eligibility check result' })
  checkEligibility(
    @Req() req,
    @Query('recipientType') recipientType: string,
    @Query('recipientCandidateId') recipientCandidateId?: string,
  ) {
    return this.donationsService.checkEligibility(
      req.user.id,
      recipientType,
      recipientCandidateId,
    );
  }

  @Get('history')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: "Get current user's donation history" })
  @ApiResponse({ status: 200, description: 'List of donations' })
  getDonationHistory(@Req() req) {
    return this.donationsService.getDonationHistory(req.user.id);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get donation statistics (admin only)' })
  @ApiQuery({ name: 'recipientType', required: false, enum: ['candidate', 'party'] })
  @ApiQuery({ name: 'recipientCandidateId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Aggregated donation statistics' })
  getDonationStats(
    @Query('recipientType') recipientType?: string,
    @Query('recipientCandidateId') recipientCandidateId?: string,
  ) {
    return this.donationsService.getDonationStats(
      recipientType,
      recipientCandidateId,
    );
  }

  @Get('export/:month')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export donations for State Comptroller (admin only)' })
  @ApiParam({ name: 'month', description: 'Month in YYYY-MM format' })
  @ApiResponse({ status: 200, description: 'CSV export data' })
  getComptrollerExport(@Param('month') month: string) {
    return this.donationsService.getComptrollerExport(month);
  }

  @Post()
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Create a new donation' })
  @ApiResponse({ status: 201, description: 'Donation created in pending state' })
  @ApiResponse({ status: 400, description: 'Exceeds donation cap or invalid amount' })
  createDonation(@Req() req, @Body() dto: CreateDonationDto) {
    return this.donationsService.createDonation(dto, req.user.id);
  }

  @Post('confirm')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Confirm a donation after payment' })
  @ApiResponse({ status: 201, description: 'Donation confirmed' })
  @ApiResponse({ status: 400, description: 'Donation not in pending state' })
  confirmDonation(@Body() dto: ConfirmDonationDto) {
    return this.donationsService.confirmDonation(dto);
  }

  @Post(':donationId/refund')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Refund a completed donation (admin only)' })
  @ApiParam({ name: 'donationId', description: 'Donation UUID' })
  @ApiResponse({ status: 201, description: 'Donation refunded' })
  @ApiResponse({ status: 400, description: 'Donation not in completed state' })
  refundDonation(
    @Req() req,
    @Param('donationId', ParseUUIDPipe) donationId: string,
  ) {
    return this.donationsService.refundDonation(donationId, req.user.id);
  }
}
