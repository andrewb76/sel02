import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import Loki from 'lokipush';
import Transport = require('winston-transport');

// import { Logger } from 'winston';
// export class AppLogger extends Logger {
// }

class MyLokiTransport extends Transport {
  private loki;

  constructor(vars) {
    super({});
    this.loki = new Loki(
      `https://${vars.LOG_LOKI_USER}:${vars.LOG_LOKI_API_KEY}@${vars.LOG_LOKI_POD}.grafana.net/loki/api/v1/push`,
      { metadata: { app: `vkgpt-${vars.NODE_ENV}` } },
    );
  }

  log(info, callback) {
    const { context, message, level } = info;

    this.loki.addLog(`[${context}] ${message}`, { level });
    // console.log('MyLokiTransport', info);
    // do whatever you want with log data
    if (callback) callback();
  }
}

export function getLogTransport(vars): any {
  const trList = [];
  if (vars.NODE_ENV === 'development') {
    trList.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike(vars.APP_NAME, {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
    );
  }

  if (vars.LOG_LOKI_IS_ON === 'true') {
    trList  .push(new MyLokiTransport(vars));
  }

  return trList;
}
