import { Controller, Get, Post, Body, Param, Delete, Put, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../database/entities/user.entity';

class ClaimAdminDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @IsString()
  @IsNotEmpty()
  secretKey!: string;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post('claim-admin')
  @ApiOperation({ summary: 'Активация прав администратора по секретному ключу/ссылке' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        secretKey: { type: 'string', example: 'banana_secret_admin_2026' },
      },
      required: ['userId', 'secretKey'],
    },
  })
  @ApiResponse({ status: 200, description: 'Права администратора успешно получены' })
  claimAdmin(@Body() body: ClaimAdminDto) {
    return this.usersService.claimAdmin(body.userId, body.secretKey);
  }

  @Get('verify-secret')
  @ApiOperation({ summary: 'Проверка валидности секретного ключа администратора' })
  @ApiQuery({ name: 'key', required: true, description: 'Секретный ключ' })
  verifySecret(@Query('key') key: string) {
    const isValid = this.usersService.verifySecretKey(key);
    return { valid: isValid };
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Статистика пользователей для админ-панели' })
  getAdminStats() {
    return this.usersService.getAdminStats();
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Получение публичного профиля игрока с учётом настроек приватности' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Публичный профиль пользователя' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  findPublicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findPublicProfile(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOneSafe(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }
}
