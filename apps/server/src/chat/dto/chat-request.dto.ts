import { IsString, IsOptional, MinLength } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @MinLength(1, { message: 'Prompt cannot be empty' })
  prompt!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
