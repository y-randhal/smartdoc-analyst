import { ApiProperty } from '@nestjs/swagger';
import type { DocumentSource } from '@smartdoc-analyst/api-interfaces';

export class ConversationMessageDto {
  @ApiProperty({ description: 'Message ID' })
  id!: string;

  @ApiProperty({
    description: 'Message role',
    enum: ['user', 'assistant'],
  })
  role!: 'user' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  content!: string;

  @ApiProperty({
    description: 'Message timestamp',
    type: 'string',
    format: 'date-time',
  })
  timestamp!: Date;

  @ApiProperty({
    description: 'Document sources (for assistant messages)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        content: { type: 'string' },
        metadata: { type: 'object' },
        score: { type: 'number' },
      },
    },
    required: false,
  })
  sources?: DocumentSource[];
}

export class ConversationDto {
  @ApiProperty({ description: 'Conversation ID' })
  id!: string;

  @ApiProperty({
    description: 'Messages in the conversation',
    type: [ConversationMessageDto],
  })
  messages!: ConversationMessageDto[];

  @ApiProperty({
    description: 'Conversation creation timestamp',
    type: 'string',
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    type: 'string',
    format: 'date-time',
  })
  updatedAt!: Date;
}

export class ConversationSummaryDto {
  @ApiProperty({ description: 'Conversation ID' })
  id!: string;

  @ApiProperty({ description: 'Conversation title (generated from first message)' })
  title!: string;

  @ApiProperty({
    description: 'Last update timestamp',
    type: 'string',
    format: 'date-time',
  })
  updatedAt!: Date;
}

export class DeleteConversationResponseDto {
  @ApiProperty({ description: 'Whether the conversation was successfully deleted' })
  deleted!: boolean;
}
