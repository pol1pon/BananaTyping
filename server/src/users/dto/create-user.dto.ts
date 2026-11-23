import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Username' })
  username!: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  password!: string;
}
