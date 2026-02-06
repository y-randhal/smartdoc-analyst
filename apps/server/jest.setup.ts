import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';

Object.assign(global, { TextDecoder, TextEncoder, ReadableStream });
