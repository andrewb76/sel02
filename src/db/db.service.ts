import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient, gql } from 'graphql-request';

import { FIND_USER_QUERY } from './gql/queries';

import { INSERT_USER_MUTATION, LOG_USAGE_MUTATION } from './gql/mutations';

export interface IUser {
  id?: number;
  vk_id?: number;
  full_name?: string;
  last_gpt_id?: string;
}

@Injectable()
export class DbService {
  constructor(
    @InjectGraphQLClient() private readonly gqlClient: GraphQLClient,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.logger.verbose('DbService init done');

    this.logger.log('silly', `[DB::Serv] silly level demo`);
    this.logger.log('debug', `[DB::Serv] debug level demo`);
    this.logger.log('verbose', `[DB::Serv] verbose level demo`);
    this.logger.log('info', `[DB::Serv] info level demo`);
    this.logger.log('warn', `[DB::Serv] warn level demo`);
    this.logger.log('error', `[DB::Serv] error level demo`);
  }

  async findUserByVkId(vk_id: number): Promise<IUser> {
    this.logger.verbose(`[DB::Serv] DbService:findUserByVkId [${vk_id}]`);

    return this.gqlClient
      .request(FIND_USER_QUERY, {
        vk_id,
      })
      .then((resp) => {
        this.logger.debug(JSON.stringify(resp, null, 2));
        return resp?.Users[0];
      })
      .catch((error) => {
        this.logger.error(`[DB::Serv:findUserByVkId] ${JSON.stringify(error)}`);
      });
  }

  async createVkUser(vk_id: number, full_name = ''): Promise<IUser> {
    this.logger.verbose(
      'createUser vkId, full_name: [' + vk_id + ', ' + full_name + ']',
    );

    const resp = await this.gqlClient
      .request(INSERT_USER_MUTATION, {
        vk_id,
        full_name,
      })
      .then((resp) => {
        this.logger.verbose(
          '[DB::Serv] createUser resp: [' + JSON.stringify(resp) + ']',
        );
        return resp?.Users[0];
      })
      .catch((error) => {
        this.logger.error(`[DB::Serv:createVkUser] ${JSON.stringify(error)}`);
      });
    return resp;
  }

  async logUsage({
    id,
    last_gpt_message_id,
    prompt_tokens,
    completion_tokens,
  }): Promise<boolean> {
    this.logger.verbose(
      'setLastMsgId Id, last_gpt_message_id:  [' +
        id +
        ', ' +
        last_gpt_message_id +
        ']',
    );
    this.logger.verbose(`DbServ::logUsage:req [${LOG_USAGE_MUTATION}]}`);
    return this.gqlClient
      .request(LOG_USAGE_MUTATION, {
        id: id.toString(),
        last_gpt_message_id,
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      })
      .then((resp) => {
        this.logger.verbose(
          `DbServ::logUsage:resp ${JSON.stringify(resp.data)}`,
        );
        return true;
      })
      .catch((error) => {
        this.logger.error(`[DB::Serv:logUsage] ${JSON.stringify(error)}`);
        return false;
      });
  }
}
