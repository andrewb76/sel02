import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService, IUser } from '../db/db.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

const vkApi = require('node-vk-bot-api/lib/api');

@Injectable()
export class VkUsersService {
  private api;
  private l: Logger;

  constructor(
    private db: DbService,
    private config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.l = this.logger.child({ context: 's:vk:user' });

    this.api = (method, params) => {
      return vkApi(method, {
        ...params,
        access_token: process.env.VK_TOKEN,
      });
    };
  }

  getUserById(id: number): Promise<IUser> {
    return new Promise(async (resolve, reject) => {
      const user = await this.db.findUserByVkId(id);
      this.l.verbose(`[getUserById:findUserByVkId]: ${JSON.stringify(user)}`);
      if (user?.id) {
        this.l.info(`getUserById:found [${user.full_name}]`);
        return resolve(user);
      } else {
        try {
          const {
            response: [user],
          } = await this.api('users.get', { user_ids: id });
          const full_name = `${user.first_name} ${user.last_name}`;
          const newUser = await this.db.createVkUser(id, full_name);
          this.l.info(
            `getUserById::createVkUser:resp [${JSON.stringify(newUser)}]`,
          );
          return newUser;
        } catch (error) {
          return reject(error);
        }
      }
    });
  }
}
