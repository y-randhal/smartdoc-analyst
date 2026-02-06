#!/usr/bin/env node
/**
 * Validates that all required .env keys are present before starting the NestJS server.
 * Run via: node scripts/validate-env.js
 * Exits 0 if valid, 1 if missing keys.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');

const REQUIRED_KEYS = [
  'GROQ_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX_NAME',
  'HUGGINGFACE_API_KEY',
];

const PLACEHOLDERS = [
  'your_groq_api_key_here',
  'your_pinecone_api_key_here',
  'your_huggingface_api_key_here',
];

function parseEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('❌ .env file not found. Copy .env.example to .env and fill in your API keys.');
    process.exit(1);
  }

  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const env = parseEnv(content);

  const missing = [];
  const placeholder = [];

  for (const key of REQUIRED_KEYS) {
    const value = env[key];
    if (value === undefined || value === '') {
      missing.push(key);
    } else if (PLACEHOLDERS.some((p) => value.includes(p) || value === p)) {
      placeholder.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required env vars:', missing.join(', '));
    process.exit(1);
  }

  if (placeholder.length > 0) {
    console.error('❌ Replace placeholder values in .env for:', placeholder.join(', '));
    process.exit(1);
  }

  console.log('✓ All required env vars are set');
  process.exit(0);
}

main();
