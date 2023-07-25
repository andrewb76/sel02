import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService, IUser } from '../db/db.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

const vkApi = require('node-vk-bot-api/lib/api');

@Injectable()
export class VkMsgService {
  // private users;
  private api;
  private l: Logger;

  constructor(
    private db: DbService,
    private config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    // this.users = new Map();
    this.l = this.logger.child({ context: 's:vk:msg' });
    this.api = (method, params) => {
      return vkApi(method, {
        ...params,
        access_token: process.env.VK_TOKEN,
      });
    };
  }

  markAsRead(id: number): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const { response } = await this.api('messages.markAsRead', {
          start_message_id: id,
        });
        this.l.verbose(
          `VkMsgServ:::markAsRead::resp [${JSON.stringify(response)}]`,
        );
        return resolve(true);
      } catch (error) {
        return reject(error);
      }
    });
  }
}
