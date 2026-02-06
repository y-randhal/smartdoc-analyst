import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Mock global crypto for tests
let uuidCounter = 0;
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  },
});

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock TextDecoder/TextEncoder for Node.js environment
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input?: Uint8Array): string {
      return Buffer.from(input || []).toString('utf-8');
    }
  } as unknown as typeof global.TextDecoder;
}

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input: string): Uint8Array {
      return new Uint8Array(Buffer.from(input, 'utf-8'));
    }
  } as unknown as typeof global.TextEncoder;
}
