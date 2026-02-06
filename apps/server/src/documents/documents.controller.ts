import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { IngestionService } from '@smartdoc-analyst/ai-engine';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadedFileShape {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list() {
    return this.documentsService.listDocuments();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deleted = await this.documentsService.deleteDocument(id);
    if (!deleted) {
      throw new NotFoundException('Document not found');
    }
    return { deleted: true };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    })
  )
  async upload(@UploadedFile() file: UploadedFileShape | undefined) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const mimeType = file.mimetype || 'application/octet-stream';
    if (!IngestionService.isSupportedMimeType(mimeType) && !IngestionService.isSupportedFilename(file.originalname)) {
      throw new BadRequestException(
        'Unsupported file type. Supported: PDF (.pdf), Text (.txt), Markdown (.md)'
      );
    }

    try {
      IngestionService.validateFileSize(file.size);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'File too large');
    }

    return this.documentsService.ingestFile(file.buffer, file.originalname, mimeType);
  }

  @Post('upload-stream')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    })
  )
  async uploadStream(
    @UploadedFile() file: UploadedFileShape | undefined,
    @Res({ passthrough: false }) res: Response
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const mimeType = file.mimetype || 'application/octet-stream';
    if (!IngestionService.isSupportedMimeType(mimeType) && !IngestionService.isSupportedFilename(file.originalname)) {
      throw new BadRequestException(
        'Unsupported file type. Supported: PDF (.pdf), Text (.txt), Markdown (.md)'
      );
    }

    try {
      IngestionService.validateFileSize(file.size);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'File too large');
    }

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const event of this.documentsService.ingestFileWithProgress(
        file.buffer,
        file.originalname,
        mimeType
      )) {
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
