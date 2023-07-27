import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { VkModule } from './vk/vk.module';
import { GptModule } from './gpt/gpt.module';
import { DbModule } from './db/db.module';
import config from './config/configuration';
import * as winston from 'winston';
import { ScheduleModule } from '@nestjs/schedule';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getLogTransport } from './app.helpers';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL,
      transports: getLogTransport(process.env),
    }),
    ScheduleModule.forRoot(),
    PrometheusModule.register({
      defaultLabels: {
        app: process.env.APP_NAME,
      },
      pushgateway: {
        // url: 'https://prometheus-prod-01-eu-west-0.grafana.net/api/prom/push',
        url: 'https://251246:glc_eyJvIjoiNTY0MTkwIiwibiI6InN0YWNrLTI3NTc1OC1obS1wcm9tZXRoZXVzIiwiayI6InU0dnI5ZzhCTG5pczBxUUE5STIxNDZxMCIsIm0iOnsiciI6ImV1In19@prometheus-prod-01-eu-west-0.grafana.net/api/prom/push',
        // options: {
        //   basic_auth: {
        //     username: 251246,
        //     password: 'glc_eyJvIjoiNTY0MTkwIiwibiI6InN0YWNrLTI3NTc1OC1obS1wcm9tZXRoZXVzIiwiayI6InU0dnI5ZzhCTG5pczBxUUE5STIxNDZxMCIsIm0iOnsiciI6ImV1In19',
        //   },
        // },
      },
    }),
    EventEmitterModule.forRoot({ wildcard: true }),
    DbModule,
    VkModule,
    GptModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppController, AppController],
})
export class AppModule {}
