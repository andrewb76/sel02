import { HttpService } from '@nestjs/axios';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { lastValueFrom, map } from 'rxjs';
import { DbService } from 'src/db/db.service';
import { Logger } from 'winston';

export enum EGptStatus {
  ready = 'Ready',
  busy = 'Busy',
  hot = 'Hot',
}

export interface IGptTask {
  addedAt: Date;
  owner: string;
  user: any;
  request: string;
  message: any;
}

@Injectable()
export class GptService {
  private gptStatus = EGptStatus.ready;
  private hotDelay = 0;
  private pool: Array<IGptTask> = [];
  private l: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private db: DbService,
    private readonly eventEmitter: EventEmitter2,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.l = this.logger.child({ context: 's:gpt' });

    this.l.log('silly', `silly level demo`);
    this.l.log('debug', `debug level demo`);
    this.l.log('verbose', `verbose level demo`);
    this.l.log('info', `info level demo`);
    this.l.log('warn', `warn level demo`);
    this.l.log('error', `error level demo`);
  }

  @Interval(2000)
  private processing() {
    if (this.gptStatus === EGptStatus.hot && this.hotDelay > 0) {
      this.hotDelay--;
    } else if (this.gptStatus === EGptStatus.hot && this.hotDelay === 0) {
      this.gptStatus = EGptStatus.ready;
    } else if (this.gptStatus === EGptStatus.ready && this.pool.length) {
      this.l.verbose('Trying to get GPT response');
      this.gptStatus = EGptStatus.busy;
      const taskForProcessing = this.pool.shift();
      // this.metricsService.setPoolSize(this.pool.length);
      this.resolveTask(taskForProcessing)
        .then((resp) => {
          this.l.debug(`GPT Response: ${JSON.stringify(resp)}`);
          this.gptStatus = EGptStatus.ready;
          // taskForProcessing.cb(resp.response);

          this.l.info(`processing ${JSON.stringify(resp.response)}`);

          // this.db.setLastUserMsgId(taskForProcessing.user.id, )

          this.eventEmitter.emit('vk.replay', {
            // to: taskForProcessing.owner,
            to: taskForProcessing.message.peer_id,
            text: `👮 Для [${taskForProcessing.user.full_name}], ${resp.response}`,
            // text: `👮 Для [${taskForProcessing.user.full_name}], ${resp.response}`,
            // message: taskForProcessing.message,
          });
          // this.metricsService.incrementRequestCounter('success');
          // this.metricsService.setRequestDelayHistogram('success', differenceInMilliseconds(new Date(), taskForProcessing.addedAt));
        })
        .catch((error) => {
          // this.metricsService.incrementRequestCounter('failed');
          // this.metricsService.setRequestDelayHistogram('failed', differenceInMilliseconds(new Date(), taskForProcessing.addedAt));
          this.l.warn(
            `${JSON.stringify({ error, taskForProcessing })}, [[ GPT error ]]`,
          );
          if (error?.status === 429) {
            this.pool.unshift(taskForProcessing),
              // this.metricsService.setPoolSize(this.pool.length);

              (this.gptStatus = EGptStatus.hot);
            this.hotDelay = 3;
          } else {
            // this.l.error('GPT Error:', JSON.stringify(?Zerror, null, 2));
            this.gptStatus = EGptStatus.hot;
            this.hotDelay = 4;
          }
        });
    }
  }

  @OnEvent('db.logUsage')
  private async logUsage(payload) {
    this.l.info(
      `@OnEvent('db.logUsage')::logUsage [${JSON.stringify(payload)}]`,
    );
    await this.db.logUsage(payload);
  }

  @OnEvent('gpt.request')
  getNewJob(payload: any): void {
    this.l.info(
      `@OnEvent('gpt.request')::poolSize [${
        this.pool.length
      }] [${JSON.stringify(payload)}] [${this.hotDelay}]`,
    );
    // return
    this.pool.push({ ...payload, addedAt: new Date() });
  }

  private resolveTask(task: IGptTask): Promise<any> {
    this.l.info(`resolveTask::poolSize [${this.pool.length}]`);
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.,',
          // //   // content: `Представь что ты психиатор и ведеш прием латентного алкоголика, поинтересуйся своими словами, какие мысли навели меня на этот вопрос, незабывай шутить и советовать всякие народные средства для торможения психики`,
          //   content: `Я хочу чтобы ты выступил в роли офицара государственной безопасности, и любой вопрос нужно свести в шутку и переворачивать в обратный вопрос, например:
          //   с какой целью я интерисуюсь данной информацией, на кого я работаю? есть ли родственники заграницей, или чтото в этом роде, прояви креативность, говори с издевками и подколами.
          //   `,
        },
        { role: 'user', content: task.request },
      ],
      // messages: [{ role: 'user', content: task.request, user: 'model' }],
    };
    this.l.verbose(`resolveTask:requestBody ${JSON.stringify(requestBody)}`);

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.get('gpt.apiKey')}`,
      },
    };

    // if (this.config.get('gpt.moc')) {
    //   return Promise.resolve({
    //     id: '1234567',
    //     userId: task.owner,
    //     created: new Date(),
    //     query: task.request,
    //     response: `Moc resp. [${task.request}]`,
    //   });
    // }
    // } else {
    // }

    return lastValueFrom(
      this.http
        .post('https://api.openai.com/v1/chat/completions', requestBody, config)
        .pipe(
          map((d) => {
            this.l.info(`resolveTask:originResp ${JSON.stringify(d.data)}`);
            const {
              usage: { prompt_tokens, completion_tokens },
            } = d.data;

            this.eventEmitter.emit('db.logUsage', {
              id: parseInt(task.user.id, 10),
              last_gpt_message_id: d.data.id,
              prompt_tokens,
              completion_tokens,
            });

            const resp = {
              id: d.data.id,
              userId: task.owner,
              created: d.data.created,
              query: task.request,
              response:
                d.data.choices[d.data.choices.length - 1].message.content,
            };
            return resp;
          }),
        )
        .pipe(
          map((d) => {
            this.l.info(`gpt.response ${JSON.stringify(d)}`);
            return d;
          }),
        ),
    );
  }
}
