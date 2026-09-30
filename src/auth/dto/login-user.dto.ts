import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'El correo electrónico registrado del usuario',
    example: 'usuario@ejemplo.com',
    maxLength: 100,
    minLength: 5,
  })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @IsString({ message: 'validation.isString' })
  @IsEmail({}, { message: 'validation.isEmail' })
  @MaxLength(100, { message: 'validation.maxLength' })
  @MinLength(5, { message: 'validation.minLength' })
  email!: string;

  @ApiProperty({
    description: 'La contraseña del usuario',
    example: 'Password123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @IsString({ message: 'validation.isString' })
  @MinLength(8, { message: 'validation.minLength' })
  @MaxLength(50, { message: 'validation.maxLength' })
  password!: string;
}
