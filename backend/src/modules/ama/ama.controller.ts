import {
  Controller,
  Get,
  Post,
  Patch,
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
import { AmaService } from './ama.service';
import { AmaGateway } from './ama.gateway';
import { CreateAmaSessionDto } from './dto/create-ama-session.dto';
import { UpdateAmaSessionDto } from './dto/update-ama-session.dto';
import { SubmitQuestionDto } from './dto/submit-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { ModerateQuestionDto } from './dto/moderate-question.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { AmaSessionStatus } from './entities/ama-session.entity';
import { AmaQuestionStatus } from './entities/ama-question.entity';

@ApiTags('AMA Sessions')
@Controller('ama')
export class AmaController {
  constructor(
    private readonly amaService: AmaService,
    private readonly amaGateway: AmaGateway,
  ) {}

  // ── Public endpoints ──────────────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: 'List AMA sessions with optional status filter' })
  @ApiQuery({ name: 'status', required: false, enum: AmaSessionStatus })
  @ApiResponse({ status: 200, description: 'List of AMA sessions' })
  getSessions(@Query('status') status?: AmaSessionStatus) {
    return this.amaService.getSessions(status ? { status } : undefined);
  }

  // Static route MUST come before dynamic :sessionId route
  @Get('sessions/upcoming')
  @ApiOperation({ summary: 'Get upcoming and live AMA sessions' })
  @ApiResponse({ status: 200, description: 'Upcoming and live sessions' })
  getUpcomingSessions() {
    return this.amaService.getUpcomingSessions();
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get a single AMA session with questions' })
  @ApiParam({ name: 'sessionId', description: 'AMA Session UUID' })
  @ApiResponse({ status: 200, description: 'The AMA session with questions' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  getSession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.amaService.getSession(sessionId);
  }

  @Post('sessions/:sessionId/questions')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a question to an AMA session (app user)' })
  @ApiParam({ name: 'sessionId', description: 'AMA Session UUID' })
  @ApiResponse({ status: 201, description: 'Question submitted' })
  @ApiResponse({ status: 400, description: 'Profanity detected or max questions reached' })
  async submitQuestion(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SubmitQuestionDto,
    @Req() req: any,
  ) {
    dto.sessionId = sessionId;
    const question = await this.amaService.submitQuestion(dto, req.user.id);
    return { data: question };
  }

  @Post('questions/:questionId/upvote')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote a question (app user)' })
  @ApiParam({ name: 'questionId', description: 'AMA Question UUID' })
  @ApiResponse({ status: 201, description: 'Upvote recorded' })
  @ApiResponse({ status: 400, description: 'Already upvoted' })
  async upvoteQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Req() req: any,
  ) {
    const question = await this.amaService.upvoteQuestion(
      questionId,
      req.user.id,
    );
    this.amaGateway.broadcastQuestionUpvoted(
      question.sessionId,
      question.id,
      question.upvoteCount,
    );
    return { data: question };
  }

  // ── Admin endpoints ───────────────────────────────────────────────────

  @Post('sessions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new AMA session (admin only)' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async createSession(@Body() dto: CreateAmaSessionDto, @Req() req: any) {
    const session = await this.amaService.createSession(dto, req.user.id);
    return { data: session };
  }

  @Patch('sessions/:sessionId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an AMA session (admin only)' })
  @ApiParam({ name: 'sessionId', description: 'AMA Session UUID' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateAmaSessionDto,
  ) {
    const session = await this.amaService.updateSession(sessionId, dto);
    return { data: session };
  }

  @Post('sessions/:sessionId/start')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start an AMA session (admin only)' })
  @ApiParam({ name: 'sessionId', description: 'AMA Session UUID' })
  @ApiResponse({ status: 201, description: 'Session started' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async startSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const session = await this.amaService.startSession(sessionId);
    this.amaGateway.broadcastSessionStatusChanged(sessionId, session.status);
    return { data: session };
  }

  @Post('sessions/:sessionId/end')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End an AMA session (admin only)' })
  @ApiParam({ name: 'sessionId', description: 'AMA Session UUID' })
  @ApiResponse({ status: 201, description: 'Session ended' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async endSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const session = await this.amaService.endSession(sessionId);
    this.amaGateway.broadcastSessionStatusChanged(sessionId, session.status);
    return { data: session };
  }

  @Post('questions/:questionId/moderate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a question (admin only)' })
  @ApiParam({ name: 'questionId', description: 'AMA Question UUID' })
  @ApiResponse({ status: 201, description: 'Question moderated' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async moderateQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: ModerateQuestionDto,
    @Req() req: any,
  ) {
    const question = await this.amaService.moderateQuestion(
      questionId,
      dto,
      req.user.id,
    );
    if (question.status === 'approved') {
      this.amaGateway.broadcastNewQuestion(question.sessionId, question);
    }
    return { data: question };
  }

  @Post('questions/:questionId/answer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Answer a question (admin only)' })
  @ApiParam({ name: 'questionId', description: 'AMA Question UUID' })
  @ApiResponse({ status: 201, description: 'Question answered' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async answerQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    const question = await this.amaService.answerQuestion(questionId, dto);
    this.amaGateway.broadcastQuestionAnswered(question.sessionId, question);
    return { data: question };
  }

  @Post('questions/:questionId/pin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pin/unpin a question (admin only)' })
  @ApiParam({ name: 'questionId', description: 'AMA Question UUID' })
  @ApiResponse({ status: 201, description: 'Question pin toggled' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async pinQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    const question = await this.amaService.pinQuestion(questionId);
    return { data: question };
  }
}
