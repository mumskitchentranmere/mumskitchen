#!/usr/bin/env node
/**
 * Cross-platform script to copy public/ and .next/static/ into the standalone
 * build directory after `next build`. Works on Linux (Hostinger), macOS, Windows.
 */
const { cpSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const root       = process.cwd();
const standalone = join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  console.error('ERROR: .next/standalone does not exist. Run `next build` first.');
  process.exit(1);
}

// Copy public/ → .next/standalone/public/
const publicDest = join(standalone, 'public');
mkdirSync(publicDest, { recursive: true });
if (existsSync(join(root, 'public'))) {
  cpSync(join(root, 'public'), publicDest, { recursive: true, force: true });
  console.log('✓ public/ copied');
}

// Copy .next/static/ → .next/standalone/.next/static/
const staticSrc  = join(root, '.next', 'static');
const staticDest = join(standalone, '.next', 'static');
mkdirSync(staticDest, { recursive: true });
if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDest, { recursive: true, force: true });
  console.log('✓ .next/static/ copied');
}

// Copy .env.local → .next/standalone/.env.local
// Standalone server.js reads env files from its own directory, not the project root
const envSrc  = join(root, '.env.local');
const envDest = join(standalone, '.env.local');
if (existsSync(envSrc)) {
  cpSync(envSrc, envDest, { force: true });
  console.log('✓ .env.local copied to standalone');
} else {
  console.warn('⚠ .env.local not found — server will have no env vars!');
}

console.log('✓ Standalone build assets ready');
