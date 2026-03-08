export class RegisterUserDto {
    email!: string;
    password!: string;
    name!: string;
}

export class LoginUserDto {
    email!: string;
    password!: string;
}

export interface JwtPayload {
    sub: string;
    email: string;
}
