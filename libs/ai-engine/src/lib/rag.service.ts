/**
 * RAG Service - Orchestrates retrieval and generation using LangChain
 * Implements Clean Architecture: this is the use case / application service layer
 */

import { ChatGroq } from '@langchain/groq';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { Pinecone } from '@pinecone-database/pinecone';
import type { AIEngineConfig } from './types';
import type { RetrievedDocument } from '@smartdoc-analyst/api-interfaces';

const RAG_PROMPT_TEMPLATE = `You are SmartDoc Analyst, a helpful assistant that answers questions based on the provided context from documents.

Context from documents:
{context}

User question: {question}

Provide a clear and accurate answer based only on the context above. If the context doesn't contain relevant information, say so.`;

export class RAGService {
  private llm: ChatGroq;
  private vectorStore: PineconeStore | null = null;
  private embeddings: HuggingFaceInferenceEmbeddings;
  private config: AIEngineConfig;

  constructor(config: AIEngineConfig) {
    this.config = config;

    this.llm = new ChatGroq({
      apiKey: config.groqApiKey,
      model: config.llmModel ?? 'llama-3.3-70b-versatile',
      temperature: 0.2,
    });

    this.embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: config.huggingFaceApiKey,
      model: config.embeddingModel ?? 'sentence-transformers/all-MiniLM-L6-v2',
    });
  }

  /**
   * Initialize Pinecone vector store (lazy initialization)
   */
  private async getVectorStore(): Promise<PineconeStore> {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    const pinecone = new Pinecone({
      apiKey: this.config.pineconeApiKey,
    });

    const index = pinecone.Index(this.config.pineconeIndexName);

    this.vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex: index,
      namespace: this.config.pineconeNamespace,
    });

    return this.vectorStore;
  }

  /**
   * Retrieve relevant documents from Pinecone
   */
  async retrieveDocuments(query: string, topK = 4): Promise<RetrievedDocument[]> {
    const store = await this.getVectorStore();
    const results = await store.similaritySearchWithScore(query, topK);

    return results.map(([doc, score]) => ({
      id: doc.metadata?.id as string ?? crypto.randomUUID(),
      content: doc.pageContent,
      metadata: doc.metadata as Record<string, unknown>,
      score: 1 - score,
    }));
  }

  /**
   * Generate response using RAG pipeline
   */
  async generateResponse(prompt: string, topK = 4): Promise<{ answer: string; sources: RetrievedDocument[] }> {
    const sources = await this.retrieveDocuments(prompt, topK);
    const context = sources.map((s) => s.content).join('\n\n---\n\n');

    const promptTemplate = PromptTemplate.fromTemplate(RAG_PROMPT_TEMPLATE);
    const chain = promptTemplate.pipe(this.llm).pipe(new StringOutputParser());

    const answer = await chain.invoke({
      context: context || 'No relevant documents found.',
      question: prompt,
    });

    return {
      answer: (answer as string).trim(),
      sources,
    };
  }

  /**
   * Stream response using RAG pipeline
   */
  async *generateResponseStream(
    prompt: string,
    topK = 4
  ): AsyncGenerator<{ type: 'chunk'; content: string } | { type: 'sources'; sources: RetrievedDocument[] }> {
    const sources = await this.retrieveDocuments(prompt, topK);
    const context = sources.map((s) => s.content).join('\n\n---\n\n');

    const promptTemplate = PromptTemplate.fromTemplate(RAG_PROMPT_TEMPLATE);
    const chain = promptTemplate.pipe(this.llm).pipe(new StringOutputParser());

    const stream = await chain.stream({
      context: context || 'No relevant documents found.',
      question: prompt,
    });

    for await (const chunk of stream) {
      if (typeof chunk === 'string' && chunk) {
        yield { type: 'chunk', content: chunk };
      }
    }

    yield { type: 'sources', sources };
  }
}
