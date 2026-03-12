import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AdsService } from './ads.service';
import { CreateAdPlacementDto } from './dto/create-ad-placement.dto';
import { UpdateAdPlacementDto } from './dto/update-ad-placement.dto';
import { RecordImpressionDto } from './dto/record-impression.dto';
import { RecordClickDto } from './dto/record-click.dto';
import { RejectPlacementDto } from './dto/reject-placement.dto';
import { AdPlacementType } from './entities/candidate-ad-placement.entity';
import { CompanyAdType } from './entities/company-ad.entity';
import { CreateCompanyAdvertiserDto } from './dto/create-company-advertiser.dto';
import { CreateCompanyAdDto } from './dto/create-company-ad.dto';
import { UpdateCompanyAdDto } from './dto/update-company-ad.dto';
import { RejectCompanyAdDto } from './dto/reject-company-ad.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  // ─── Public endpoints ──────────────────────────────────────

  @Get('placements')
  @ApiOperation({ summary: 'Get active targeted ads by type' })
  @ApiQuery({ name: 'type', required: true, enum: AdPlacementType })
  @ApiResponse({ status: 200, description: 'Active ad placements' })
  getActivePlacements(@Query('type') type: AdPlacementType) {
    return this.adsService.getActivePlacements(type);
  }

  @Post('impression')
  @ApiOperation({ summary: 'Record an ad impression' })
  @ApiResponse({ status: 201, description: 'Impression recorded' })
  recordImpression(@Body() dto: RecordImpressionDto) {
    return this.adsService.recordImpression(dto.placementId);
  }

  @Post('click')
  @ApiOperation({ summary: 'Record an ad click' })
  @ApiResponse({ status: 201, description: 'Click recorded' })
  recordClick(@Body() dto: RecordClickDto) {
    return this.adsService.recordClick(dto.placementId);
  }

  // ─── Admin endpoints (static routes BEFORE dynamic) ────────

  @Get('admin/placements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all ad placements (admin)' })
  @ApiQuery({ name: 'type', required: false, enum: AdPlacementType })
  @ApiQuery({ name: 'candidateId', required: false, type: String })
  @ApiQuery({ name: 'isApproved', required: false, type: Boolean })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'All ad placements' })
  getAllPlacements(
    @Query('type') type?: AdPlacementType,
    @Query('candidateId') candidateId?: string,
    @Query('isApproved') isApproved?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adsService.getAllPlacements({
      type,
      candidateId,
      isApproved: isApproved !== undefined ? isApproved === 'true' : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get ad placement statistics (admin)' })
  @ApiQuery({ name: 'candidateId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Aggregated ad statistics' })
  getPlacementStats(@Query('candidateId') candidateId?: string) {
    return this.adsService.getPlacementStats(candidateId);
  }

  @Post('admin/placements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new ad placement (admin)' })
  @ApiQuery({ name: 'candidateId', required: true, type: String })
  @ApiResponse({ status: 201, description: 'Ad placement created' })
  createPlacement(
    @Body() dto: CreateAdPlacementDto,
    @Query('candidateId') candidateId: string,
  ) {
    return this.adsService.createPlacement(dto, candidateId);
  }

  // ─── Static sub-resource routes (MUST be before dynamic :id routes) ───

  @Get('admin/analytics/breakdown')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get breakdown analytics (by type, candidate, pacing)' })
  @ApiResponse({ status: 200, description: 'Breakdown stats' })
  getBreakdownStats() {
    return this.adsService.getBreakdownStats();
  }

  // ─── Company Ad public endpoints ─────────────────────────────────────
  @Get('company/active')
  @ApiOperation({ summary: 'Get active company ads by type' })
  @ApiQuery({ name: 'type', required: true, enum: CompanyAdType })
  @ApiResponse({ status: 200, description: 'Active company ads' })
  getActiveCompanyAds(@Query('type') type: CompanyAdType) {
    return this.adsService.getActiveCompanyAds(type);
  }

  @Post('company/impression')
  @ApiOperation({ summary: 'Record a company ad impression' })
  @ApiResponse({ status: 201, description: 'Impression recorded' })
  recordCompanyAdImpression(@Body() dto: RecordImpressionDto) {
    return this.adsService.recordCompanyAdImpression(dto.placementId);
  }

  @Post('company/click')
  @ApiOperation({ summary: 'Record a company ad click' })
  @ApiResponse({ status: 201, description: 'Click recorded' })
  recordCompanyAdClick(@Body() dto: RecordClickDto) {
    return this.adsService.recordCompanyAdClick(dto.placementId);
  }

  // ─── Company Ad admin: static routes BEFORE :id ─────────────────────

  @Get('admin/company/advertisers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all company advertisers (admin)' })
  @ApiResponse({ status: 200, description: 'Company advertisers' })
  getAllCompanyAdvertisers() {
    return this.adsService.getAllCompanyAdvertisers();
  }

  @Post('admin/company/advertisers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a company advertiser (admin)' })
  @ApiResponse({ status: 201, description: 'Advertiser created' })
  createCompanyAdvertiser(@Body() dto: CreateCompanyAdvertiserDto) {
    return this.adsService.createCompanyAdvertiser(dto);
  }

  @Get('admin/company/placements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all company ads (admin)' })
  @ApiQuery({ name: 'type', required: false, enum: CompanyAdType })
  @ApiQuery({ name: 'advertiserId', required: false, type: String })
  @ApiQuery({ name: 'isApproved', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'All company ads' })
  getAllCompanyAds(
    @Query('type') type?: CompanyAdType,
    @Query('advertiserId') advertiserId?: string,
    @Query('isApproved') isApproved?: string,
  ) {
    return this.adsService.getAllCompanyAds({
      adType: type,
      advertiserId,
      isApproved: isApproved !== undefined ? isApproved === 'true' : undefined,
    });
  }

  @Post('admin/company/placements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a company ad (admin)' })
  @ApiQuery({ name: 'advertiserId', required: true, type: String })
  @ApiResponse({ status: 201, description: 'Company ad created' })
  createCompanyAd(
    @Body() dto: CreateCompanyAdDto,
    @Query('advertiserId') advertiserId: string,
  ) {
    return this.adsService.createCompanyAd(dto, advertiserId);
  }

  @Patch('admin/company/placements/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a company ad (admin)' })
  @ApiParam({ name: 'id', description: 'Company ad UUID' })
  @ApiResponse({ status: 200, description: 'Company ad updated' })
  updateCompanyAd(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyAdDto,
  ) {
    return this.adsService.updateCompanyAd(id, dto);
  }

  @Post('admin/company/placements/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a company ad (admin)' })
  @ApiParam({ name: 'id', description: 'Company ad UUID' })
  @ApiResponse({ status: 201, description: 'Company ad approved' })
  approveCompanyAd(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.adsService.approveCompanyAd(id, req.user?.id || 'system');
  }

  @Post('admin/company/placements/:id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a company ad (admin)' })
  @ApiParam({ name: 'id', description: 'Company ad UUID' })
  @ApiResponse({ status: 201, description: 'Company ad rejected' })
  rejectCompanyAd(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectCompanyAdDto,
    @Req() req,
  ) {
    return this.adsService.rejectCompanyAd(id, dto.reason, req.user?.id || 'system');
  }

  @Post('admin/company/placements/:id/pause')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pause a company ad (admin)' })
  @ApiParam({ name: 'id', description: 'Company ad UUID' })
  @ApiResponse({ status: 201, description: 'Company ad paused' })
  pauseCompanyAd(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.adsService.pauseCompanyAd(id, req.user?.id || 'system');
  }

  @Post('admin/company/placements/:id/resume')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resume a company ad (admin)' })
  @ApiParam({ name: 'id', description: 'Company ad UUID' })
  @ApiResponse({ status: 201, description: 'Company ad resumed' })
  resumeCompanyAd(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.adsService.resumeCompanyAd(id, req.user?.id || 'system');
  }

  @Post('admin/company/placements/:id/end')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'End a company ad (admin)' })
  @ApiParam({ name: 'id', description: 'Company ad UUID' })
  @ApiResponse({ status: 201, description: 'Company ad ended' })
  endCompanyAd(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.adsService.endCompanyAd(id, req.user?.id || 'system');
  }

  // ─── Dynamic :id routes ────────────────────────────────────────────

  @Patch('admin/placements/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an ad placement (admin)' })
  @ApiParam({ name: 'id', description: 'Ad placement UUID' })
  @ApiResponse({ status: 200, description: 'Ad placement updated' })
  updatePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdPlacementDto,
  ) {
    return this.adsService.updatePlacement(id, dto);
  }

  @Post('admin/placements/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve an ad placement (admin)' })
  @ApiParam({ name: 'id', description: 'Ad placement UUID' })
  @ApiResponse({ status: 201, description: 'Ad placement approved' })
  approvePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    return this.adsService.approvePlacement(id, req.user?.id || 'system');
  }

  @Post('admin/placements/:id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject an ad placement (admin)' })
  @ApiParam({ name: 'id', description: 'Ad placement UUID' })
  @ApiResponse({ status: 201, description: 'Ad placement rejected' })
  rejectPlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPlacementDto,
    @Req() req,
  ) {
    return this.adsService.rejectPlacement(id, dto.reason, req.user?.id || 'system');
  }

  @Post('admin/placements/:id/pause')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pause an approved ad placement (admin)' })
  @ApiParam({ name: 'id', description: 'Ad placement UUID' })
  @ApiResponse({ status: 201, description: 'Ad placement paused' })
  pausePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    return this.adsService.pausePlacement(id, req.user?.id || 'system');
  }

  @Post('admin/placements/:id/resume')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resume a paused ad placement (admin)' })
  @ApiParam({ name: 'id', description: 'Ad placement UUID' })
  @ApiResponse({ status: 201, description: 'Ad placement resumed' })
  resumePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    return this.adsService.resumePlacement(id, req.user?.id || 'system');
  }

  @Post('admin/placements/:id/end')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'End an ad placement (admin)' })
  @ApiParam({ name: 'id', description: 'Ad placement UUID' })
  @ApiResponse({ status: 201, description: 'Ad placement ended' })
  endPlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    return this.adsService.endPlacement(id, req.user?.id || 'system');
  }

  @Delete('admin/placements/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate an ad placement (admin)' })
  @ApiParam({ name: 'id', description: 'Ad placement UUID' })
  @ApiResponse({ status: 200, description: 'Ad placement deactivated' })
  deactivatePlacement(@Param('id', ParseUUIDPipe) id: string) {
    return this.adsService.deactivatePlacement(id);
  }
}
