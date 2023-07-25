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
  private l: Logger;
  constructor(
    @InjectGraphQLClient() private readonly gqlClient: GraphQLClient,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.l = this.logger.child({ context: 's:db' });
    this.l.verbose('DbService init done');

    this.l.log('silly', `[DB::Serv] silly level demo`);
    this.l.log('debug', `[DB::Serv] debug level demo`);
    this.l.log('verbose', `[DB::Serv] verbose level demo`);
    this.l.log('info', `[DB::Serv] info level demo`);
    this.l.log('warn', `[DB::Serv] warn level demo`);
    this.l.log('error', `[DB::Serv] error level demo`);
  }

  async findUserByVkId(vk_id: number): Promise<IUser> {
    this.l.verbose(`[DB::Serv] DbService:findUserByVkId [${vk_id}]`);

    return this.gqlClient
      .request(FIND_USER_QUERY, {
        vk_id,
      })
      .then((resp) => {
        this.logger.debug(JSON.stringify(resp, null, 2));
        return resp?.Users[0];
      })
      .catch((error) => {
        this.l.error(`[DB::Serv:findUserByVkId] ${JSON.stringify(error)}`);
      });
  }

  async createVkUser(vk_id: number, full_name = ''): Promise<IUser> {
    this.l.verbose(
      'createUser vkId, full_name: [' + vk_id + ', ' + full_name + ']',
    );

    const resp = await this.gqlClient
      .request(INSERT_USER_MUTATION, {
        vk_id,
        full_name,
      })
      .then((resp) => {
        this.l.verbose(
          '[DB::Serv] createUser resp: [' + JSON.stringify(resp) + ']',
        );
        return resp?.Users[0];
      })
      .catch((error) => {
        this.l.error(`[DB::Serv:createVkUser] ${JSON.stringify(error)}`);
      });
    return resp;
  }

  async logUsage({
    id,
    last_gpt_message_id,
    prompt_tokens,
    completion_tokens,
  }): Promise<boolean> {
    this.l.verbose(
      'setLastMsgId Id, last_gpt_message_id:  [' +
        id +
        ', ' +
        last_gpt_message_id +
        ']',
    );
    this.l.verbose(`DbServ::logUsage:req [${LOG_USAGE_MUTATION}]}`);
    return this.gqlClient
      .request(LOG_USAGE_MUTATION, {
        id: id.toString(),
        last_gpt_message_id,
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      })
      .then((resp) => {
        this.l.verbose(`DbServ::logUsage:resp ${JSON.stringify(resp.data)}`);
        return true;
      })
      .catch((error) => {
        this.l.error(`[DB::Serv:logUsage] ${JSON.stringify(error)}`);
        return false;
      });
  }
}
