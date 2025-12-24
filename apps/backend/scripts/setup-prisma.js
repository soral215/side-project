#!/usr/bin/env node

/**
 * Railway 배포 시 DATABASE_URL을 확인하여
 * PostgreSQL인 경우 schema.prisma의 provider를 postgresql로 변경
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, '../prisma/schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf-8');

// DATABASE_URL 확인
const databaseUrl = process.env.DATABASE_URL || '';

// PostgreSQL인 경우 (postgresql:// 또는 postgres://로 시작)
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  console.log('🔍 PostgreSQL detected, updating schema.prisma provider to postgresql');
  
  // provider를 postgresql로 변경
  const updatedContent = schemaContent.replace(
    /provider\s*=\s*["']sqlite["']/,
    'provider = "postgresql"'
  );
  
  writeFileSync(schemaPath, updatedContent, 'utf-8');
  console.log('✅ schema.prisma updated to use postgresql');
} else {
  console.log('🔍 SQLite detected, keeping schema.prisma provider as sqlite');
}

