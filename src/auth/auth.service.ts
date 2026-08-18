import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserPayload {
  id: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_ANON_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn('Supabase credentials missing. Auth will fail.');
    }
  }

  async validateUser(email: string, password: string): Promise<UserPayload | null> {
    if (!this.supabase) {
      throw new UnauthorizedException('Supabase not configured');
    }

    // Call Supabase to verify credentials
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      this.logger.warn(`Failed login attempt for ${email}: ${error?.message}`);
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
    };
  }

  async login(user: UserPayload) {
    const payload: UserPayload = { id: user.id, email: user.email };
    // Issue our own JWT for internal API usage based on Supabase validation
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async register(email: string, password: string) {
    if (!this.supabase) {
      throw new UnauthorizedException('Supabase not configured');
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      this.logger.error(`Failed registration for ${email}: ${error?.message}`);
      throw new UnauthorizedException(error?.message || 'Registration failed');
    }

    const payload: UserPayload = {
      id: data.user.id,
      email: data.user.email || email,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: payload.id,
        email: payload.email,
      },
    };
  }
}
