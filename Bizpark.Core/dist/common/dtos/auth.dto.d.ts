export declare class RegisterUserDto {
    email: string;
    password: string;
    name: string;
}
export declare class LoginUserDto {
    email: string;
    password: string;
}
export interface JwtPayload {
    sub: string;
    email: string;
}
