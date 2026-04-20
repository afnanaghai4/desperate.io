import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Module({
  imports: [ConfigModule, UsersModule],
  providers: [AiOrchestratorService],
  exports: [AiOrchestratorService],
})
export class AiOrchestratorModule {}
