import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordCredential } from '../entities/password-credential.entity';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    TypeOrmModule.forFeature([PasswordCredential]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret || jwtSecret.trim() === '') {
          throw new Error(
            'JWT_SECRET environment variable is not set or is empty',
          );
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN') || '1d',
          },
        };
      },
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
