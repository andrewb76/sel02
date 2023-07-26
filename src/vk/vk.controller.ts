import { Body, Controller, HttpCode, Post, Inject } from '@nestjs/common';
import { VkService } from './vk.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
// import { formatDuration, intervalToDuration, fromUnixTime } from 'date-fns';

@Controller('bot')
export class VkController {
  private l: Logger;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly vkService: VkService,
  ) {
    this.l = this.logger.child({ context: 'c:vk' });
  }

  @Post('/')
  @HttpCode(200)
  bot(@Body() body: any): string {
    // if (cb?.object?.message?.date) {
    //   // this.l.verbose(fromUnixTime(cb.object.message.date))
    //   // let duration = intervalToDuration({
    //   //   start: fromUnixTime(cb.object.message.date),
    //   //   end: new Date(),
    //   // });

    //   // cb.object.message.age_minutes = duration.minutes;

    // }
    this.l.verbose(`IN msg ::: [${JSON.stringify(body)}]`);
    const resp = this.vkService.getBotResp(body);
    return resp;
  }
}
