import { Injectable, Inject } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { getUnixTime } from 'date-fns';
import { VkUsersService } from './vk.service.user';
import { ConfigService } from '@nestjs/config';
import { VkMsgService } from './vk.service.msg';

const VkBot = require('node-vk-bot-api');


@Injectable()
export class VkService {
  private isReady = false;
  private bot;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly vkUsers: VkUsersService,
    private readonly vkMsg: VkMsgService,
    private readonly eventEmitter: EventEmitter2,
    private config: ConfigService,
  ) {
    this.logger.verbose('VkService init done');

    this.bot = new VkBot({
      token: process.env.VK_TOKEN,
      confirmation: process.env.VK_CONFIRMATION_TOKEN,
      group_id: process.env.VK_GROUP_ID,
      secret: process.env.VK_BOT_SECRET,
    });

    this.bot.command('/', (ctx) => {
      this.isReady && this.processRequest(ctx);
    });

    this.bot.use(async (ctx, next) => {
      try {
        this.logger.verbose('Bot MW');
        next();
      } catch (error) {
        this.logger.error(error);
      }
    });

    if (this.config.get('vk.longPoll')) {
      this.logger.verbose(this.config.get('vk.longPoll'));
      this.logger.verbose('Bot Polling is On');

      this.bot.startPolling((err) => {
        if (err) {
          this.logger.error(`VkBotPolling [${JSON.stringify(err)}]`);
        }
      });
    } else {
      this.logger.verbose('Bot Polling is Off');
    }
  }

  @OnEvent('vk.replay')
  private async vkReply(payload: any): Promise<void> {
    this.logger.info(`@OnEvent('vk.replay') [${payload.to}] [${payload.text}]`);
    this.logger.debug(`ToReply: ${JSON.stringify(payload)}`);
    if (this.config.get('vk.replay')) {
      try {
        await this.bot.sendMessage(payload.to, payload.text);
      } catch (error) {
        this.logger.error(JSON.stringify(error, null, 2));
      }
    } else {
      this.logger.info(`@OnEvent('vk.replay') [Silent mode]`);
    }
  }

  public getBotCB(cb: any) {
    if (this.config.get('vk.webhook')) {
      this.logger.info('VkS::getBotCB start');
      return this.bot.webhookCallback(cb);
    } else {
      this.logger.warn('VkS::getBotCB skip', (...par) => { console.log('>>>>>>>', par); });
      cb();
    }
  }

  private async processRequest(ctx) {
    const { message } = ctx;
    const age = getUnixTime(new Date()) - message.date;
    this.logger.info(`VkS::processRequest ${message.text}, Age: ${age}`);
    this.logger.verbose(`VkS::processRequest [${JSON.stringify(message)}]`);
    // if (age > 10) {
    //   this.logger.info(`VkS::processRequest Skip`);
    //   // Игнорируем старые запросы //
    //   return;
    // }
    this.logger.info(`VkS::processRequest Pass`);
    // this.logger.log(message, 'VK_S:process message >>>');
    const user = await this.vkUsers.getUserById(message.from_id);
    // this.logger.log(user, 'VK_S:get user info >>>');
    this.vkMsg.markAsRead(message.conversation_message_id);
    const payload = { 
      addedAt: new Date(),
      owner: message.from_id,
      request: message.text.substr(1),
      user,
      message,
    };
    this.logger.info(`VK_S:E:gpt.request 1 : ${JSON.stringify(payload)}`);
    setTimeout(() => {
      this.logger.info(`VK_S:E:gpt.request 2 :`);
      this.eventEmitter.emit('gpt.request', payload);
    }, 2500);
  }

  @Timeout(3000)
  private enableService() {
    this.isReady = true;
  }
}
