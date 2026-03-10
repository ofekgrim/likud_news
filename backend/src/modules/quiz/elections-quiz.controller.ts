import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';

/**
 * Admin-facing quiz routes nested under /elections/:electionId/quiz.
 * These match the admin panel's expected API paths.
 */
@ApiTags('Elections / Quiz')
@Controller('elections')
export class ElectionsQuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get(':electionId/quiz/averages')
  @ApiOperation({ summary: 'Get average quiz match percentages per candidate (public)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Average match percentages per candidate' })
  getAverages(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.quizService.getAverageResults(electionId);
  }

  @Get(':electionId/quiz/responses')
  @ApiOperation({ summary: 'Get all quiz responses for an election (admin)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Quiz responses with user info' })
  getResponses(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.quizService.getResponses(electionId);
  }

  @Get(':electionId/quiz')
  @ApiOperation({ summary: 'Get all quiz questions for an election (admin)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'All quiz questions (active + inactive)' })
  getQuestions(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.quizService.getAllQuestions(electionId);
  }

  @Post(':electionId/quiz')
  @ApiOperation({ summary: 'Create a quiz question for an election (admin)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 201, description: 'Question created' })
  createQuestion(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    dto.electionId = electionId;
    return this.quizService.createQuestion(dto);
  }

  @Put(':electionId/quiz/reorder')
  @ApiOperation({ summary: 'Reorder quiz questions (admin)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Questions reordered' })
  reorderQuestions(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.quizService.reorderQuestions(electionId, body.orderedIds);
  }

  @Put(':electionId/quiz/:id')
  @ApiOperation({ summary: 'Update a quiz question (admin)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  updateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.quizService.updateQuestion(id, dto);
  }

  @Delete(':electionId/quiz/:id')
  @ApiOperation({ summary: 'Soft-delete a quiz question (admin)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question soft-deleted' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(@Param('id', ParseUUIDPipe) id: string) {
    await this.quizService.deleteQuestion(id);
    return { success: true };
  }
}
