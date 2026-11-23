import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john_doe_updated', description: 'Username' })
  username?: string;

  @ApiPropertyOptional({ example: 'john_updated@example.com', description: 'Email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'New password' })
  password?: string;
}
