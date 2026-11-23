import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { LeaderboardsService } from './leaderboards.service';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';
import { LeaderBoard } from '../database/entities/leaderboard.entity';

@ApiTags('Leaderboards')
@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new leaderboard entry' })
  @ApiBody({ type: CreateLeaderboardDto })
  @ApiResponse({ status: 201, description: 'Leaderboard entry created', type: LeaderBoard })
  create(@Body() createLeaderboardDto: CreateLeaderboardDto): Promise<LeaderBoard> {
    return this.leaderboardsService.create(createLeaderboardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leaderboard entries' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'all'], description: 'Фильтр по периоду (daily - за 24 часа, all - за все время)' })
  @ApiResponse({ status: 200, description: 'List of all entries', type: [LeaderBoard] })
  findAll(@Query('period') period?: string): Promise<LeaderBoard[]> {
    return this.leaderboardsService.findAll(period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leaderboard entry by ID' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  @ApiResponse({ status: 200, description: 'Entry found', type: LeaderBoard })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  findOne(@Param('id',ParseIntPipe) id: number): Promise<LeaderBoard | null> {
    return this.leaderboardsService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get leaderboard entries by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of user entries', type: [LeaderBoard] })
  findByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<LeaderBoard[]> {
    return this.leaderboardsService.findByUserId(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update leaderboard entry by ID' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  @ApiBody({ type: UpdateLeaderboardDto })
  @ApiResponse({ status: 200, description: 'Entry updated', type: LeaderBoard })
  update(@Param('id') id: string, @Body() updateLeaderboardDto: UpdateLeaderboardDto): Promise<LeaderBoard | null> {
    return this.leaderboardsService.update(+id, updateLeaderboardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete leaderboard entry by ID' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  remove(@Param('id') id: string): Promise<void> {
    return this.leaderboardsService.remove(+id);
  }
}
