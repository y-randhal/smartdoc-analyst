/**
 * AI Engine configuration types
 */

export interface AIEngineConfig {
  groqApiKey: string;
  pineconeApiKey: string;
  pineconeIndexName: string;
  pineconeNamespace?: string;
  huggingFaceApiKey?: string;
  embeddingModel?: string;
  llmModel?: string;
}
