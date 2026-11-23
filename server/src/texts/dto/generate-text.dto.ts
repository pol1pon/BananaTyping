import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GenerateTextDto {
  @ApiPropertyOptional({ example: 'ru', enum: ['ru', 'en'], description: 'Language for text generation' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  language?: 'ru' | 'en';

  @ApiPropertyOptional({ example: 'программирование', description: 'Topic or theme (e.g. программирование, бананы, космос, цитаты, технологии)' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard'], description: 'Difficulty level' })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiPropertyOptional({ example: 'medium', enum: ['short', 'medium', 'long'], description: 'Desired text length' })
  @IsOptional()
  @IsIn(['short', 'medium', 'long'])
  length?: 'short' | 'medium' | 'long';
}
