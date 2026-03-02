import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommunityPollsService } from './community-polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Community Polls')
@Controller('community-polls')
export class CommunityPollsController {
  constructor(
    private readonly communityPollsService: CommunityPollsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all community polls' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'List of community polls' })
  findAll(@Query('isActive') isActive?: string) {
    const active =
      isActive !== undefined
        ? isActive === 'true' || isActive === '1'
        : undefined;
    return this.communityPollsService.findAll(active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single community poll by ID' })
  @ApiParam({ name: 'id', description: 'Poll UUID' })
  @ApiResponse({ status: 200, description: 'The community poll' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityPollsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new community poll (admin only)' })
  @ApiResponse({ status: 201, description: 'Poll created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreatePollDto) {
    return this.communityPollsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a community poll (admin only)' })
  @ApiParam({ name: 'id', description: 'Poll UUID' })
  @ApiResponse({ status: 200, description: 'Poll updated successfully' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePollDto,
  ) {
    return this.communityPollsService.update(id, dto);
  }

  @Post(':id/close')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a community poll (admin only)' })
  @ApiParam({ name: 'id', description: 'Poll UUID' })
  @ApiResponse({ status: 201, description: 'Poll closed successfully' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  closePoll(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityPollsService.closePoll(id);
  }

  @Post(':id/vote')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a community poll (app user)' })
  @ApiParam({ name: 'id', description: 'Poll UUID' })
  @ApiResponse({ status: 201, description: 'Vote recorded successfully' })
  @ApiResponse({ status: 400, description: 'Poll is closed or invalid option' })
  @ApiResponse({ status: 409, description: 'Already voted' })
  vote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VotePollDto,
    @Req() req: any,
  ) {
    return this.communityPollsService.vote(req.user.id, id, dto);
  }

  @Get(':id/my-vote')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user has voted on a poll (app user)' })
  @ApiParam({ name: 'id', description: 'Poll UUID' })
  @ApiResponse({ status: 200, description: 'User vote status' })
  getUserVote(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.communityPollsService.getUserVote(req.user.id, id);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get poll results with percentages' })
  @ApiParam({ name: 'id', description: 'Poll UUID' })
  @ApiResponse({ status: 200, description: 'Poll results with vote counts and percentages' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  getResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityPollsService.getResults(id);
  }
}
