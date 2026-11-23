import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeaderboardDto {
  @ApiPropertyOptional({ example: 1, description: 'User ID' })
  userId?: number;

  @ApiPropertyOptional({ example: '120', description: 'New words per minute' })
  wpm?: number;

  @ApiPropertyOptional({ example: '98.0', description: 'New accuracy percentage' })
  accuracy?: number;

  @ApiPropertyOptional({ example: '45', description: 'New duration in seconds' })
  duration_sec?: number;
}
