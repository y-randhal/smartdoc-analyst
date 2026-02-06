import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    description: 'User question or prompt',
    example: 'What is the main topic discussed in the uploaded documents?',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Prompt cannot be empty' })
  prompt!: string;

  @ApiProperty({
    description: 'Optional conversation ID to continue an existing conversation',
    example: 'conv-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

export * from './chat-response.dto';
