import { Controller, Get, Inject, Injectable } from '@nestjs/common';
import { AppService } from './app.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';


@Injectable()
@Controller()
export class AppController {
  private l: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly appService: AppService,
  ) {
    this.l = this.logger.child({ context: 'app:c' })
    this.l.info('DbService init done', { test: 'test' });
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
