import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { VkService } from './vk.service';
// import { formatDuration, intervalToDuration, fromUnixTime } from 'date-fns';

@Controller('bot')
export class VkController {
  constructor(private readonly vkService: VkService) {}

  @Post('/')
  @HttpCode(200)
  bot(@Body() cb: any): string {
    // if (cb?.object?.message?.date) {
    //   // console.log(fromUnixTime(cb.object.message.date))
    //   // let duration = intervalToDuration({
    //   //   start: fromUnixTime(cb.object.message.date),
    //   //   end: new Date(),
    //   // });

    //   // cb.object.message.age_minutes = duration.minutes;

    // }
    console.log(
      'IN msg ::: ',
      `[${JSON.stringify(cb)}]`,
    );
    const resp = this.vkService.getBotCB(cb);
    return resp;
  }
}
