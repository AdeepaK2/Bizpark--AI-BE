import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3002;
  await app.listen(port);

  const url = `http://localhost:${port}`;
  const logger = new Logger('Bootstrap');
  logger.log(`Bizpark Admin MVC frontend ready → ${url}`);
}
bootstrap();
