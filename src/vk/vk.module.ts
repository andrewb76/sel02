import { Module } from '@nestjs/common';
import { VkService } from './vk.service';
import { VkUsersService } from './vk.service.user';
import { VkController } from './vk.controller';
import { VkMsgService } from './vk.service.msg';

@Module({
  providers: [VkService, VkUsersService, VkMsgService],
  controllers: [VkController],
})
export class VkModule {}
