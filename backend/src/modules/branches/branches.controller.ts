import {
  Controller,
  Get,
  Post,
  Patch,
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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { QueryBranchLeaderboardDto } from './dto/query-leaderboard.dto';
import { AssignMemberDto } from './dto/assign-member.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  // ─── Static routes MUST come before :id ─────────────────────

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get weekly branch leaderboard (public)' })
  @ApiResponse({ status: 200, description: 'Branch leaderboard sorted by perCapitaScore' })
  getLeaderboard(@Query() query: QueryBranchLeaderboardDto) {
    return this.branchesService.getLeaderboard(query);
  }

  @Get('leaderboard/national')
  @ApiOperation({ summary: 'Get national top branches (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results' })
  @ApiResponse({ status: 200, description: 'National branch leaderboard' })
  getNationalLeaderboard(@Query('limit') limit?: number) {
    return this.branchesService.getNationalLeaderboard(limit ? +limit : undefined);
  }

  @Post('admin/compute-scores')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually trigger weekly score computation (admin)' })
  @ApiResponse({ status: 201, description: 'Scores computed successfully' })
  computeScores() {
    return this.branchesService.computeWeeklyScores();
  }

  @Patch('members/assign')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Assign current user to a branch' })
  @ApiResponse({ status: 200, description: 'User assigned to branch' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  assignMember(@Req() req, @Body() dto: AssignMemberDto) {
    return this.branchesService.updateMemberBranch(req.user.id, dto.branchId);
  }

  // ─── CRUD routes ────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all branches (public)' })
  @ApiQuery({ name: 'district', required: false, description: 'Filter by district' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  findAll(@Query('district') district?: string) {
    return this.branchesService.findAll(district);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single branch with latest score (public)' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch details with latest weekly score' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new branch (admin)' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  @ApiResponse({ status: 409, description: 'Branch name already exists' })
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a branch (admin)' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, dto);
  }
}
