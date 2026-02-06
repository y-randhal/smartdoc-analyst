import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() dto: ChatRequestDto) {
    return this.chatService.processPrompt(dto.prompt);
  }

  @Post('stream')
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
