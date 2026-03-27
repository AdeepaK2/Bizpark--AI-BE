import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip unknown properties from body
      forbidNonWhitelisted: false,
      transform: true,       // auto-cast query params / body to DTO types
    }),
  );
  await app.listen(process.env.PORT ?? 3003);
}

bootstrap();
