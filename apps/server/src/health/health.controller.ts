import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  check() {
    const env = {
      pinecone: !!this.config.get<string>('PINECONE_API_KEY'),
      groq: !!this.config.get<string>('GROQ_API_KEY'),
      huggingface: !!this.config.get<string>('HUGGINGFACE_API_KEY'),
    };
    const ready = env.pinecone && env.groq && env.huggingface;

    return {
      status: ready ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        env,
      },
    };
  }
}
