export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  GEMINI_API_KEY: string;
}

export const env: EnvConfig = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'pulsedev-enterprise-secret-2026',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://pulsedev:secret@localhost:5432/pulsedev',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
