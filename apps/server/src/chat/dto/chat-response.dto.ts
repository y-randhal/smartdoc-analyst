import { ApiProperty } from '@nestjs/swagger';

export class DocumentSourceDto {
  @ApiProperty({ description: 'Unique identifier for the document chunk' })
  id!: string;

  @ApiProperty({ description: 'Content of the retrieved document chunk' })
  content!: string;

  @ApiProperty({
    description: 'Metadata associated with the document',
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Similarity score (0-1) indicating relevance to the query',
    minimum: 0,
    maximum: 1,
  })
  score?: number;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'AI-generated response message' })
  message!: string;

  @ApiProperty({
    description: 'Document sources used to generate the response',
    type: [DocumentSourceDto],
  })
  sources?: DocumentSourceDto[];

  @ApiProperty({
    description: 'Conversation ID (if conversation was created or continued)',
  })
  conversationId?: string;
}

export class ChatStreamEventDto {
  @ApiProperty({
    description: 'Content chunk (for streaming responses)',
  })
  content?: string;

  @ApiProperty({
    description: 'Document sources (sent after streaming completes)',
    type: [DocumentSourceDto],
  })
  sources?: DocumentSourceDto[];

  @ApiProperty({
    description: 'Conversation ID',
  })
  conversationId?: string;

  @ApiProperty({
    description: 'Error message (if an error occurred)',
  })
  error?: string;
}
