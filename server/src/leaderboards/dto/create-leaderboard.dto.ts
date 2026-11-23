import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}