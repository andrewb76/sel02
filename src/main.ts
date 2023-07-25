import { WinstonModuleOptions } from 'nest-winston';
import { WinstonModule } from 'nest-winston';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getLogTransport } from './app.helpers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      level: process.env.LOG_LEVEL,
      transports: getLogTransport(process.env),
    } as WinstonModuleOptions),
  });
  await app.listen(process.env.PORT);
}
bootstrap();
