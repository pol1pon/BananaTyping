import { IsIn, IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaderboardDto {
  @ApiProperty({ description: 'ID пользователя' })
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ description: 'Скорость печати (WPM)' })
  @IsNumber()
  @IsNotEmpty()
  wpm!: number;

  @ApiProperty({ description: 'Точность печати в процентах' })
  @IsNumber()
  @IsNotEmpty()
  accuracy!: number;

  @ApiProperty({ description: 'Длительность заезда в секундах' })
  @IsNumber()
  @IsNotEmpty()
  duration_sec!: number;

  @ApiPropertyOptional({ description: 'Язык раскладки (ru / en)' })
  @IsOptional()
  @IsString()
  @IsIn(['ru', 'en'])
  language?: string;

  @ApiPropertyOptional({ description: 'Режим тренировки (text / time / endless / quick)' })
  @IsOptional()
  @IsString()
  @IsIn(['text', 'time', 'endless', 'quick'])
  mode?: string;

  @ApiPropertyOptional({ description: 'Количество набранных символов' })
  @IsOptional()
  @IsNumber()
  characters?: number;

  @ApiPropertyOptional({ description: 'Количество ошибок' })
  @IsOptional()
  @IsNumber()
  errors?: number;
}