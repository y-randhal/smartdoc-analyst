import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { ChatGroq } from '@langchain/groq';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

export interface ServiceHealth {
  available: boolean;
  latency?: number;
  error?: string;
}

export interface HealthCheckResult {
  pinecone: ServiceHealth;
  groq: ServiceHealth;
  huggingface: ServiceHealth;
  allHealthy: boolean;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Check if environment variables are configured
   */
  checkEnvironment(): {
    pinecone: boolean;
    groq: boolean;
    huggingface: boolean;
  } {
    return {
      pinecone: !!this.config.get<string>('PINECONE_API_KEY'),
      groq: !!this.config.get<string>('GROQ_API_KEY'),
      huggingface: !!this.config.get<string>('HUGGINGFACE_API_KEY'),
    };
  }

  /**
   * Check connectivity to Pinecone
   */
  async checkPinecone(): Promise<ServiceHealth> {
    const apiKey = this.config.get<string>('PINECONE_API_KEY');
    const indexName = this.config.get<string>('PINECONE_INDEX_NAME', 'smartdoc-index');

    if (!apiKey) {
      return { available: false, error: 'API key not configured' };
    }

    try {
      const startTime = Date.now();
      const pinecone = new Pinecone({ apiKey });
      const index = pinecone.Index(indexName);

      // Try to describe the index (lightweight operation)
      await index.describeIndexStats();
      const latency = Date.now() - startTime;

      return { available: true, latency };
    } catch (error) {
      this.logger.warn('Pinecone health check failed', error instanceof Error ? error.message : String(error));
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check connectivity to Groq LLM
   */
  async checkGroq(): Promise<ServiceHealth> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      return { available: false, error: 'API key not configured' };
    }

    try {
      const startTime = Date.now();
      const llm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        maxTokens: 5, // Minimal tokens for health check
      });

      // Try a very simple invoke with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      await Promise.race([llm.invoke('Hi'), timeoutPromise]);
      const latency = Date.now() - startTime;

      return { available: true, latency };
    } catch (error) {
      this.logger.warn('Groq health check failed', error instanceof Error ? error.message : String(error));
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check connectivity to Hugging Face
   */
  async checkHuggingFace(): Promise<ServiceHealth> {
    const apiKey = this.config.get<string>('HUGGINGFACE_API_KEY');

    if (!apiKey) {
      return { available: false, error: 'API key not configured' };
    }

    try {
      const startTime = Date.now();
      const embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey,
        model: 'sentence-transformers/all-MiniLM-L6-v2',
      });

      // Try embedding a small text
      await embeddings.embedQuery('test');
      const latency = Date.now() - startTime;

      return { available: true, latency };
    } catch (error) {
      this.logger.warn('Hugging Face health check failed', error instanceof Error ? error.message : String(error));
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Perform all health checks in parallel
   */
  async checkAllServices(): Promise<HealthCheckResult> {
    const [pinecone, groq, huggingface] = await Promise.allSettled([
      this.checkPinecone(),
      this.checkGroq(),
      this.checkHuggingFace(),
    ]);

    const result: HealthCheckResult = {
      pinecone:
        pinecone.status === 'fulfilled'
          ? pinecone.value
          : { available: false, error: 'Check failed' },
      groq: groq.status === 'fulfilled' ? groq.value : { available: false, error: 'Check failed' },
      huggingface:
        huggingface.status === 'fulfilled'
          ? huggingface.value
          : { available: false, error: 'Check failed' },
      allHealthy: false,
    };

    result.allHealthy =
      result.pinecone.available && result.groq.available && result.huggingface.available;

    return result;
  }
}
