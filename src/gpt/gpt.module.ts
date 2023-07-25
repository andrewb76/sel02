import { Module } from '@nestjs/common';
import { GptService } from './gpt.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [GptService, HttpModule],
})
export class GptModule {}
