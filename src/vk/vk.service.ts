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
  private l: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly vkUsers: VkUsersService,
    private readonly vkMsg: VkMsgService,
    private readonly eventEmitter: EventEmitter2,
    private config: ConfigService,
  ) {
    this.l = this.logger.child({ context: 's:vk' });
    this.l.verbose('VkService init done');

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
        this.l.verbose('Bot MW');
        next();
      } catch (error) {
        this.l.error(error);
      }
    });

    if (this.config.get('vk.longPoll')) {
      this.l.verbose(this.config.get('vk.longPoll'));
      this.l.verbose('Bot Polling is On');

      this.bot.startPolling((err) => {
        if (err) {
          this.l.error(`VkBotPolling [${JSON.stringify(err)}]`);
        }
      });
    } else {
      this.l.verbose('Bot Polling is Off');
    }
  }

  @OnEvent('vk.replay')
  private async vkReply(payload: any): Promise<void> {
    this.l.info(`@OnEvent('vk.replay') [${payload.to}] [${payload.text}]`);
    this.l.debug(`ToReply: ${JSON.stringify(payload)}`);
    if (this.config.get('vk.replay')) {
      try {
        await this.bot.sendMessage(payload.to, payload.text);
      } catch (error) {
        this.l.error(JSON.stringify(error, null, 2));
      }
    } else {
      this.l.info(`@OnEvent('vk.replay') [Silent mode]`);
    }
  }

  public getBotCB(cb: any) {
    if (this.config.get('vk.webhook')) {
      this.l.info('VkS::getBotCB start');
      return this.bot.webhookCallback(cb);
    } else {
      this.l.warn('VkS::getBotCB skip', (...par) => { console.log('>>>>>>>', par); });
      cb();
    }
  }

  private async processRequest(ctx) {
    const { message } = ctx;
    const age = getUnixTime(new Date()) - message.date;
    this.l.info(`VkS::processRequest ${message.text}, Age: ${age}`);
    this.l.verbose(`VkS::processRequest [${JSON.stringify(message)}]`);
    // if (age > 10) {
    //   this.l.info(`VkS::processRequest Skip`);
    //   // Игнорируем старые запросы //
    //   return;
    // }
    this.l.info(`VkS::processRequest Pass`);
    // this.l.log(message, 'VK_S:process message >>>');
    const user = await this.vkUsers.getUserById(message.from_id);
    // this.l.log(user, 'VK_S:get user info >>>');
    this.vkMsg.markAsRead(message.conversation_message_id);
    const payload = { 
      addedAt: new Date(),
      owner: message.from_id,
      request: message.text.substr(1),
      user,
      message,
    };
    this.l.info(`VK_S:E:gpt.request 1 : ${JSON.stringify(payload)}`);
    setTimeout(() => {
      this.l.info(`VK_S:E:gpt.request 2 :`);
      this.eventEmitter.emit('gpt.request', payload);
    }, 2500);
  }

  @Timeout(3000)
  private enableService() {
    this.isReady = true;
  }
}
