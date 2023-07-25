import { Module, Global } from '@nestjs/common';
import { DbService } from './db.service';
import { GraphQLRequestModule } from '@golevelup/nestjs-graphql-request';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    GraphQLRequestModule.forRootAsync(GraphQLRequestModule, {
      useFactory: (configService: ConfigService) => ({
        endpoint: configService.get<string>('HASURA_ENDPOINT'),
        options: {
          headers: {
            'content-type': 'application/json',
            'x-hasura-admin-secret': configService.get<string>('HASURA_SECRET'),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [DbService],
  providers: [DbService],
})
export class DbModule {}
