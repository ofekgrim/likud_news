import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active members' })
  findAllActive() {
    return this.membersService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member with related articles' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.findWithArticles(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new member' })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a member' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, updateMemberDto);
  }
}
