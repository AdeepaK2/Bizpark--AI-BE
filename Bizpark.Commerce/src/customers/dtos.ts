import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional() @IsString()
  name?: string;
}
