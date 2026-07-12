import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CodeChallengeMethod,
  OAuth2Client,
  TokenPayload,
} from 'google-auth-library';

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  nonce?: string;
  issuer?: string;
}

@Injectable()
export class GoogleOAuthService {
  constructor(private readonly configService: ConfigService) {}

  getAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): string {
    return this.createClient().generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state: params.state,
      nonce: params.nonce,
      code_challenge: params.codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: 'select_account',
    });
  }

  async exchangeCodeForIdToken(params: {
    code: string;
    codeVerifier: string;
  }): Promise<string> {
    const tokenResponse = await this.createClient().getToken({
      code: params.code,
      codeVerifier: params.codeVerifier,
    });
    const idToken = tokenResponse.tokens.id_token;
    if (!idToken) {
      throw new InternalServerErrorException(
        'Google did not return an ID token',
      );
    }
    return idToken;
  }

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
    const ticket = await this.createClient().verifyIdToken({
      idToken,
      audience: this.getRequiredConfig('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new InternalServerErrorException(
        'Google ID token is missing payload',
      );
    }

    return this.toVerifiedIdentity(payload);
  }

  private toVerifiedIdentity(payload: TokenPayload): VerifiedGoogleIdentity {
    return {
      sub: payload.sub,
      email: payload.email ?? '',
      emailVerified: payload.email_verified === true,
      nonce: payload.nonce,
      issuer: payload.iss,
    };
  }

  private createClient(): OAuth2Client {
    return new OAuth2Client(
      this.getRequiredConfig('GOOGLE_CLIENT_ID'),
      this.getRequiredConfig('GOOGLE_CLIENT_SECRET'),
      this.getRequiredConfig('GOOGLE_CALLBACK_URL'),
    );
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value || value.trim() === '') {
      throw new Error(`${key} environment variable is not set or is empty`);
    }
    return value;
  }
}
