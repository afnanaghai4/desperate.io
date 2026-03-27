import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AnalysisModule } from './analysis/analysis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JobModule } from './jobs/job.module';
import { ProjectRecommendationModule } from './project-recommendation/project-recommendation.module';

import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User],
        synchronize: true,
      }),
    }),

    HealthModule,
    UsersModule,
    AuthModule,
    JobModule,
    ProjectRecommendationModule,
    AnalysisModule,
  ],
})
export class AppModule {}
