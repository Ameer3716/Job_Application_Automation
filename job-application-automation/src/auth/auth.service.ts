import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface UserPayload {
  id: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<UserPayload | null> {
    // This will be connected to Supabase Auth in the full implementation
    // For now, return a mock user for development
    if (email && password) {
      return {
        id: 'user-123',
        email: email,
      };
    }
    return null;
  }

  async login(user: UserPayload) {
    const payload: UserPayload = { id: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async register(email: string, password: string) {
    // In production, this would call Supabase Auth signUp
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const payload: UserPayload = {
      id: `user-${Date.now()}`,
      email: email,
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
