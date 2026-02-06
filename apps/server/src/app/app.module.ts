import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from '../chat/chat.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { DocumentsModule } from '../documents/documents.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthModule,
    ChatModule,
    ConversationsModule,
    DocumentsModule,
  ],
})
export class AppModule {}
