import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
}
