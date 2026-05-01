import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from 'src/entities/job.entity';
import { UsersModule } from '../users/users.module';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { AnalysisModule } from 'src/analysis/analysis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), UsersModule, AnalysisModule],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
