import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Module({
  imports: [ConfigModule],
  providers: [AiOrchestratorService],
  exports: [AiOrchestratorService],
})
export class AiOrchestratorModule {}
