import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api', { exclude: ['/health', '/api/docs'] });
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('SmartDoc Analyst API')
    .setDescription(
      'RAG (Retrieval Augmented Generation) API for document analysis. ' +
      'Upload documents, ask questions, and get AI-powered answers based on your documents.'
    )
    .setVersion('1.0')
    .addTag('chat', 'Chat endpoints for asking questions about documents')
    .addTag('documents', 'Document management endpoints')
    .addTag('conversations', 'Conversation history management')
    .addTag('health', 'Health check and system status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SmartDoc Analyst API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`SmartDoc Analyst API running on: http://localhost:${port}/api`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
