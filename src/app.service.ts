import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as client from "prom-client";

@Injectable()
export class AppService {
  private l: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly pushgateway: client.Pushgateway
  ) {
    this.l = this.logger.child({ context: 'app:s' })
  }

  getHello(): string {
    return 'Hello World!';
  }

  // @Interval(10000)
  pushMetrics() {
    this.l.info('SS Push metrics');
    this.pushgateway.push({ jobName: 'vkgpt' });
  }
}
