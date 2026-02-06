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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { IngestionService } from '@smartdoc-analyst/ai-engine';
import {
  DocumentListResponseDto,
  IngestionResponseDto,
  DeleteDocumentResponseDto,
  UploadProgressEventDto,
} from './dto/document-response.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadedFileShape {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all indexed documents',
    description: 'Returns a list of all documents that have been uploaded and indexed.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of indexed documents',
    type: DocumentListResponseDto,
  })
  list(): DocumentListResponseDto {
    return this.documentsService.listDocuments();
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a document',
    description: 'Removes a document and all its chunks from the vector store.',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID to delete',
    example: 'doc-123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document successfully deleted',
    type: DeleteDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  async delete(@Param('id') id: string): Promise<DeleteDocumentResponseDto> {
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
  @ApiOperation({
    summary: 'Upload and index a document',
    description:
      'Upload a PDF, TXT, or MD file. The document will be parsed, chunked, embedded, ' +
      'and indexed in the vector store. Maximum file size is 10MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF, TXT, or MD file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document successfully uploaded and indexed',
    type: IngestionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file (unsupported type, too large, or empty)',
  })
  async upload(@UploadedFile() file: UploadedFileShape | undefined): Promise<IngestionResponseDto> {
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
  @ApiOperation({
    summary: 'Upload document with progress streaming',
    description:
      'Upload a document and receive real-time progress updates via NDJSON stream. ' +
      'Progress events include: parsing → chunking → indexing → done. ' +
      'Use this endpoint for better UX with progress indicators.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF, TXT, or MD file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Streaming response (NDJSON format) with progress events',
    content: {
      'application/x-ndjson': {
        schema: {
          type: 'string',
          example: '{"stage":"parsing"}\n{"stage":"chunking"}\n{"stage":"indexing","total":10}\n{"stage":"done","result":{...}}\n',
        },
      },
    },
  })
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
