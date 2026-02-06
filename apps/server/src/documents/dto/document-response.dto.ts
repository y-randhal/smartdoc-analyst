import { ApiProperty } from '@nestjs/swagger';

export class IndexedDocumentDto {
  @ApiProperty({ description: 'Unique document identifier' })
  id!: string;

  @ApiProperty({ description: 'Original filename' })
  filename!: string;

  @ApiProperty({ description: 'Number of chunks the document was split into' })
  chunks!: number;

  @ApiProperty({ description: 'ISO timestamp of when the document was uploaded' })
  uploadedAt!: string;
}

export class DocumentListResponseDto {
  @ApiProperty({
    description: 'List of indexed documents',
    type: [IndexedDocumentDto],
  })
  documents!: IndexedDocumentDto[];
}

export class IngestionResponseDto {
  @ApiProperty({ description: 'Unique identifier for the ingested document' })
  documentId!: string;

  @ApiProperty({ description: 'Number of chunks created from the document' })
  chunks!: number;

  @ApiProperty({ description: 'Original filename' })
  filename!: string;
}

export class DeleteDocumentResponseDto {
  @ApiProperty({ description: 'Whether the document was successfully deleted' })
  deleted!: boolean;
}

export class UploadProgressEventDto {
  @ApiProperty({
    description: 'Current processing stage',
    enum: ['parsing', 'chunking', 'indexing', 'done'],
  })
  stage!: 'parsing' | 'chunking' | 'indexing' | 'done';

  @ApiProperty({
    description: 'Total number of chunks (only present when stage is "indexing")',
    required: false,
  })
  total?: number;

  @ApiProperty({
    description: 'Final ingestion result (only present when stage is "done")',
    type: IngestionResponseDto,
    required: false,
  })
  result?: IngestionResponseDto;

  @ApiProperty({
    description: 'Error message (if an error occurred)',
    required: false,
  })
  error?: string;
}
