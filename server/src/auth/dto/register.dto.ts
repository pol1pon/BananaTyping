import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Username' })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}
