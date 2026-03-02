import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CampaignEventsService } from './campaign-events.service';
import { CreateCampaignEventDto } from './dto/create-campaign-event.dto';
import { UpdateCampaignEventDto } from './dto/update-campaign-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Campaign Events')
@Controller('campaign-events')
export class CampaignEventsController {
  constructor(private readonly campaignEventsService: CampaignEventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated campaign events with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of campaign events' })
  findAll(@Query() query: QueryEventsDto) {
    return this.campaignEventsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single campaign event by ID' })
  @ApiParam({ name: 'id', description: 'Campaign event UUID' })
  @ApiResponse({ status: 200, description: 'The campaign event' })
  @ApiResponse({ status: 404, description: 'Campaign event not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignEventsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new campaign event (admin only)' })
  @ApiResponse({ status: 201, description: 'Campaign event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateCampaignEventDto) {
    return this.campaignEventsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a campaign event (admin only)' })
  @ApiParam({ name: 'id', description: 'Campaign event UUID' })
  @ApiResponse({ status: 200, description: 'Campaign event updated successfully' })
  @ApiResponse({ status: 404, description: 'Campaign event not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignEventDto,
  ) {
    return this.campaignEventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a campaign event (admin only)' })
  @ApiParam({ name: 'id', description: 'Campaign event UUID' })
  @ApiResponse({ status: 200, description: 'Campaign event soft-deleted' })
  @ApiResponse({ status: 404, description: 'Campaign event not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignEventsService.remove(id);
  }

  @Post(':id/rsvp')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'RSVP to a campaign event (authenticated app user)' })
  @ApiParam({ name: 'id', description: 'Campaign event UUID' })
  @ApiResponse({ status: 201, description: 'RSVP created or updated' })
  @ApiResponse({ status: 404, description: 'Campaign event not found' })
  rsvp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RsvpEventDto,
    @Req() req,
  ) {
    return this.campaignEventsService.rsvp(req.user.id, id, dto);
  }

  @Get(':id/my-rsvp')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get current user RSVP for a campaign event' })
  @ApiParam({ name: 'id', description: 'Campaign event UUID' })
  @ApiResponse({ status: 200, description: 'User RSVP or null' })
  getUserRsvp(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    return this.campaignEventsService.getUserRsvp(req.user.id, id);
  }

  @Get(':id/rsvps')
  @ApiOperation({ summary: 'Get paginated RSVPs for a campaign event' })
  @ApiParam({ name: 'id', description: 'Campaign event UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of RSVPs' })
  getEventRsvps(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.campaignEventsService.getEventRsvps(id, +page, +limit);
  }
}
