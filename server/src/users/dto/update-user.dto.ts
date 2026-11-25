import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john_doe_updated', description: 'Username' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username?: string;

  @ApiPropertyOptional({ example: 'john_updated@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'New password' })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', description: 'User avatar (preset or URL or base64)' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Тайпер со скоростью 120 WPM', description: 'User description / bio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'user', description: 'User role (user / admin)' })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  role?: string;

  @ApiPropertyOptional({ example: false, description: 'Hide profile stats and bio from other players' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
