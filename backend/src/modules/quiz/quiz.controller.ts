import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuizService } from './quiz.service';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { OptionalAppAuthGuard } from '../app-auth/guards/optional-app-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ── Static routes first ──────────────────────────────────────────────

  @Get('elections')
  @UseGuards(OptionalAppAuthGuard)
  @ApiOperation({ summary: 'Get all elections that have quizzes (public, optionally authenticated)' })
  @ApiResponse({ status: 200, description: 'List of quiz-enabled elections with metadata' })
  getQuizElections(@Req() req) {
    const userId = req.user?.id;
    return this.quizService.getQuizElections(userId);
  }

  @Post('questions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a quiz question (admin only)' })
  @ApiResponse({ status: 201, description: 'Question created' })
  createQuestion(@Body() dto: CreateQuizQuestionDto) {
    return this.quizService.createQuestion(dto);
  }

  @Post('submit')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers and get match results' })
  @ApiResponse({ status: 201, description: 'Quiz submitted, match results returned' })
  submitQuiz(@Req() req, @Body() dto: SubmitQuizDto) {
    return this.quizService.submitQuiz(req.user.id, dto);
  }

  @Get('me/election/:electionId')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's quiz results for an election" })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Quiz response or null' })
  getMyResults(
    @Req() req,
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ) {
    return this.quizService.getMyResults(req.user.id, electionId);
  }

  @Get('election/active')
  @ApiOperation({ summary: 'Get quiz questions for the current active election' })
  @ApiResponse({ status: 200, description: 'List of quiz questions + electionId' })
  @ApiResponse({ status: 404, description: 'No active election found' })
  async getActiveElectionQuestions() {
    const electionId = await this.quizService.getActiveElectionId();
    const questions = await this.quizService.getQuestions(electionId);
    return { electionId, data: questions };
  }

  @Get('election/:electionId/averages')
  @ApiOperation({ summary: 'Get community average quiz match percentages (public)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Average match percentages per candidate' })
  getAverages(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.quizService.getAverageResults(electionId);
  }

  @Get('election/:electionId')
  @ApiOperation({ summary: 'Get all active quiz questions for an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'List of quiz questions' })
  getQuestions(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.quizService.getQuestions(electionId);
  }

  // ── Admin CRUD for individual questions ──────────────────────────────

  @Put('reorder/:electionId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder quiz questions (admin only)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Questions reordered' })
  reorderQuestions(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() body: { questionIds: string[] },
  ) {
    return this.quizService.reorderQuestions(electionId, body.questionIds);
  }

  @Put('questions/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a quiz question (admin only)' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  updateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.quizService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a quiz question (admin only)' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({ status: 204, description: 'Question soft-deleted' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  deleteQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.deleteQuestion(id);
  }
}
