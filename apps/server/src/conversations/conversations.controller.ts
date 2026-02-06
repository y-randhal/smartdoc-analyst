import { Controller, Delete, Get, NotFoundException, Param } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  list() {
    return this.conversationsService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const conv = this.conversationsService.get(id);
    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }
    return conv;
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    const deleted = this.conversationsService.delete(id);
    return { deleted };
  }
}
