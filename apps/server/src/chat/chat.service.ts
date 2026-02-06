import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RAGService } from '@smartdoc-analyst/ai-engine';
import type { ChatResponse, DocumentSource } from '@smartdoc-analyst/api-interfaces';
import { ConversationsService } from '../conversations/conversations.service';

/**
 * ChatService - Application service that orchestrates RAG flow
 * Follows Single Responsibility: delegates AI logic to RAGService
 */
@Injectable()
export class ChatService {
  private ragService: RAGService | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly conversationsService: ConversationsService
  ) {}

  /**
   * Lazy initialization of RAGService (depends on env vars)
   */
  private getRAGService(): RAGService {
    if (!this.ragService) {
      const groqApiKey = this.config.get<string>('GROQ_API_KEY');
      const pineconeApiKey = this.config.get<string>('PINECONE_API_KEY');
      const pineconeIndex = this.config.get<string>('PINECONE_INDEX_NAME', 'smartdoc-index');
      const hfApiKey = this.config.get<string>('HUGGINGFACE_API_KEY');

      if (!groqApiKey || !pineconeApiKey) {
        throw new Error(
          'Missing required env vars: GROQ_API_KEY and PINECONE_API_KEY must be set'
        );
      }

      this.ragService = new RAGService({
        groqApiKey,
        pineconeApiKey,
        pineconeIndexName: pineconeIndex,
        huggingFaceApiKey: hfApiKey,
      });
    }
    return this.ragService;
  }

  /**
   * Process user prompt: retrieve context from Pinecone, generate LLM response
   */
  async processPrompt(prompt: string): Promise<ChatResponse> {
    const rag = this.getRAGService();
    const { answer, sources } = await rag.generateResponse(prompt);

    const documentSources: DocumentSource[] = sources.map((s) => ({
      id: s.id,
      content: s.content,
      metadata: s.metadata,
      score: s.score,
    }));

    return {
      message: answer,
      sources: documentSources,
    };
  }

  /**
   * Stream LLM response for a prompt, persisting to conversation
   */
  async *processPromptStream(
    prompt: string,
    conversationId?: string
  ): AsyncGenerator<{ content?: string; sources?: DocumentSource[]; conversationId?: string }> {
    const conv = this.conversationsService.getOrCreate(conversationId);
    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    this.conversationsService.appendUserMessage(conv.id, {
      id: userMsgId,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    });

    yield { conversationId: conv.id };

    const rag = this.getRAGService();
    let fullContent = '';

    for await (const event of rag.generateResponseStream(prompt)) {
      if (event.type === 'chunk') {
        fullContent += event.content;
        yield { content: event.content, conversationId: conv.id };
      } else if (event.type === 'sources') {
        const sources = event.sources.map((s) => ({
          id: s.id,
          content: s.content,
          metadata: s.metadata,
          score: s.score,
        }));

        this.conversationsService.appendAssistantMessage(conv.id, {
          id: assistantMsgId,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
          sources,
        });

        yield { sources, conversationId: conv.id };
      }
    }
  }
}
