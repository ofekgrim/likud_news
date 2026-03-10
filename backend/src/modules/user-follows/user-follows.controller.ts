import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserFollowsService } from './user-follows.service';
import { FollowMemberDto } from './dto/follow-member.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';

@ApiTags('User Follows')
@Controller('app-users/me/follows')
@UseGuards(AppAuthGuard)
@ApiBearerAuth()
export class UserFollowsController {
  constructor(private readonly userFollowsService: UserFollowsService) {}

  @Get()
  @ApiOperation({ summary: 'Get members the current user follows' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFollowing(
    @CurrentAppUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userFollowsService.getFollowing(
      userId,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Follow a member' })
  follow(
    @CurrentAppUser('id') userId: string,
    @Body() dto: FollowMemberDto,
  ) {
    return this.userFollowsService.follow(userId, dto.memberId);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Unfollow a member' })
  unfollow(
    @CurrentAppUser('id') userId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.userFollowsService.unfollow(userId, memberId);
  }
}
