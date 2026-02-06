import { Body, Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto, ChatStreamEventDto } from './dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'Send a chat message',
    description:
      'Send a question about your documents and receive an AI-generated response with source citations.',
  })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat response with message and sources',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request (e.g., empty prompt)',
  })
  async sendMessage(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chatService.processPrompt(dto.prompt, dto.conversationId);
  }

  @Post('stream')
  @ApiOperation({
    summary: 'Stream chat response',
    description:
      'Send a question and receive a streaming response. Returns NDJSON (newline-delimited JSON) ' +
      'with content chunks and final sources. Use this for real-time UI updates.',
  })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Streaming response (NDJSON format)',
    content: {
      'application/x-ndjson': {
        schema: {
          type: 'string',
          example: '{"content":"Hello"}\n{"content":" World"}\n{"sources":[...]}\n',
        },
      },
    },
  })
  async streamMessage(@Body() dto: ChatRequestDto, @Res({ passthrough: false }) res: Response) {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const event of this.chatService.processPromptStream(dto.prompt, dto.conversationId)) {
        res.write(JSON.stringify(event) + '\n');
        (res as any).flush?.();
      }
    } catch (err) {
      res.write(JSON.stringify({ error: (err as Error).message }) + '\n');
    } finally {
      res.end();
    }
  }
}
