import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ALLOWED_ORIGINS = comma-separated list, e.g.:
  //   https://app.bizpark.app,https://bizpark.app,https://*.bizpark.app
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  app.enableCors({
    origin: allowedOrigins
      ? allowedOrigins.split(',').map((o) => o.trim())
      : true, // allow all in dev
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
