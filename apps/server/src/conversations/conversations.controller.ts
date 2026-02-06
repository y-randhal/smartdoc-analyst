import { Controller, Delete, Get, NotFoundException, Param, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import {
  ConversationDto,
  ConversationSummaryDto,
  DeleteConversationResponseDto,
} from './dto/conversation-response.dto';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all conversations',
    description: 'Returns a list of all conversation summaries.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of conversation summaries',
    type: [ConversationSummaryDto],
  })
  list(): ConversationSummaryDto[] {
    return this.conversationsService.list();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a conversation by ID',
    description: 'Retrieves a full conversation with all messages.',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    example: 'conv-123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation details',
    type: ConversationDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  get(@Param('id') id: string): ConversationDto {
    const conv = this.conversationsService.get(id);
    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }
    return conv;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a conversation',
    description: 'Permanently deletes a conversation and all its messages.',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID to delete',
    example: 'conv-123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation successfully deleted',
    type: DeleteConversationResponseDto,
  })
  delete(@Param('id') id: string): DeleteConversationResponseDto {
    const deleted = this.conversationsService.delete(id);
    return { deleted };
  }
}
