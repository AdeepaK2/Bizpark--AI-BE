import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommerceRegisterDto {
  @ApiProperty({ example: 'jane@store.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  email!: string;

  @ApiProperty({ example: 'Secret@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;
}

export class CommerceAdminRegisterDto {
  @ApiProperty({ example: 'admin@store.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  email!: string;

  @ApiProperty({ example: 'Admin@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({ example: 'Store Admin' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;
}

export class CommerceLoginDto {
  @ApiProperty({ example: 'admin@testbiz.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  email!: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'New Name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name?: string;

  @ApiPropertyOptional({ example: 'NewPass@123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword?: string;

  @ApiPropertyOptional({ example: 'OldPass@123' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currentPassword?: string;
}
