import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Service health status',
    enum: ['ok', 'degraded'],
  })
  status!: 'ok' | 'degraded';

  @ApiProperty({
    description: 'Health check timestamp',
    type: 'string',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Health check details',
    type: 'object',
    properties: {
      env: {
        type: 'object',
        properties: {
          pinecone: { type: 'boolean' },
          groq: { type: 'boolean' },
          huggingface: { type: 'boolean' },
        },
      },
    },
  })
  checks!: {
    env: {
      pinecone: boolean;
      groq: boolean;
      huggingface: boolean;
    };
  };
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns the health status of the API and checks if required environment variables are set. ' +
      'Status is "ok" if all API keys are configured, "degraded" otherwise.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status',
    type: HealthResponseDto,
  })
  check(): HealthResponseDto {
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
