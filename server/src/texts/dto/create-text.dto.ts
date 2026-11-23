import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTextDto {
  @ApiPropertyOptional({ example: 'Текст для тренировки печати...', description: 'Text content to type' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'banana', description: 'Legacy word field' })
  @IsOptional()
  @IsString()
  word?: string;

  @ApiPropertyOptional({ example: 'ru', description: 'Language code (ru, en)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'программирование', description: 'Topic or theme' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'medium', description: 'Difficulty level' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 'manual', description: 'Source of text (ai, seed, manual)' })
  @IsOptional()
  @IsString()
  source?: string;
}
