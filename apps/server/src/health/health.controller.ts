import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService, ServiceHealth } from './health.service';

export class ServiceHealthDto {
  @ApiProperty({ description: 'Whether the service is available' })
  available!: boolean;

  @ApiProperty({
    description: 'Response latency in milliseconds',
    required: false,
  })
  latency?: number;

  @ApiProperty({
    description: 'Error message if service is unavailable',
    required: false,
  })
  error?: string;
}

export class ServicesHealthDto {
  @ApiProperty({ type: () => ServiceHealthDto })
  pinecone!: ServiceHealthDto;

  @ApiProperty({ type: () => ServiceHealthDto })
  groq!: ServiceHealthDto;

  @ApiProperty({ type: () => ServiceHealthDto })
  huggingface!: ServiceHealthDto;

  @ApiProperty()
  allHealthy!: boolean;
}

export class HealthResponseDto {
  @ApiProperty({
    description: 'Service health status',
    enum: ['ok', 'degraded', 'unhealthy'],
  })
  status!: 'ok' | 'degraded' | 'unhealthy';

  @ApiProperty({
    description: 'Health check timestamp',
    type: 'string',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Environment variable configuration',
    type: 'object',
    properties: {
      pinecone: { type: 'boolean' },
      groq: { type: 'boolean' },
      huggingface: { type: 'boolean' },
    },
  })
  env!: {
    pinecone: boolean;
    groq: boolean;
    huggingface: boolean;
  };

  @ApiProperty({
    description: 'Service connectivity checks',
    type: () => ServicesHealthDto,
    required: false,
  })
  services?: ServicesHealthDto;
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly healthService: HealthService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns the health status of the API. ' +
      'By default, only checks environment variable configuration. ' +
      'Use ?checkServices=true to perform actual connectivity checks to external services.',
  })
  @ApiQuery({
    name: 'checkServices',
    required: false,
    type: Boolean,
    description: 'Perform actual connectivity checks to external services (Pinecone, Groq, Hugging Face)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status',
    type: HealthResponseDto,
  })
  async check(@Query('checkServices') checkServices?: string): Promise<HealthResponseDto> {
    const env = this.healthService.checkEnvironment();
    const envReady = env.pinecone && env.groq && env.huggingface;

    // Quick check: only environment variables
    if (!checkServices || checkServices !== 'true') {
      return {
        status: envReady ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        env,
      };
    }

    // Full check: actual connectivity
    const services = await this.healthService.checkAllServices();

    let status: 'ok' | 'degraded' | 'unhealthy';
    if (services.allHealthy) {
      status = 'ok';
    } else if (envReady) {
      // Environment is configured but services are not responding
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      env,
      services: {
        pinecone: services.pinecone,
        groq: services.groq,
        huggingface: services.huggingface,
        allHealthy: services.allHealthy,
      },
    };
  }
}
