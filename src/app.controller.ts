import { Controller, Get, LoggerService, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Timeout } from '@nestjs/schedule';

@Controller()
export class AppController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly appService: AppService,
  ) {
    this.logger.verbose('DbService init done', { test: 'test' });
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
