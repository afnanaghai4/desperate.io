import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordCredential } from '../entities/password-credential.entity';
import { AuthAccount } from '../entities/auth-account.entity';
import { OAuthLoginAttempt } from '../entities/oauth-login-attempt.entity';
import { GoogleOAuthService } from './google-oauth.service';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    TypeOrmModule.forFeature([
      PasswordCredential,
      AuthAccount,
      OAuthLoginAttempt,
    ]),
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
  providers: [AuthService, JwtStrategy, GoogleOAuthService],
})
export class AuthModule {}
