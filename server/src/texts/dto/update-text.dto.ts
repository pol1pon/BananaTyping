import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTextDto {
  @ApiPropertyOptional({ example: 'Обновленный текст для тренировки...', description: 'Text content to type' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'banana_updated', description: 'Legacy word field' })
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

  @ApiPropertyOptional({ example: 'easy', description: 'Difficulty level' })
  @IsOptional()
  @IsString()
  difficulty?: string;
}
