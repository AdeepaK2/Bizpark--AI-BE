import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'commerce-secret-change-me') {
    console.warn('\n⚠️  WARNING: JWT_SECRET is not set or is using the insecure default.\n   Set JWT_SECRET in your .env file before deploying to production.\n');
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.PORT ?? 3003);
}

bootstrap();
