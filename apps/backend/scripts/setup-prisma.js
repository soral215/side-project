#!/usr/bin/env node

/**
 * Railway 배포 시 DATABASE_URL을 확인하여
 * PostgreSQL인 경우 schema.prisma와 migration_lock.toml의 provider를 postgresql로 변경
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, '../prisma/schema.prisma');
const migrationLockPath = join(__dirname, '../prisma/migrations/migration_lock.toml');

// DATABASE_URL 확인
const databaseUrl = process.env.DATABASE_URL || '';

// PostgreSQL인 경우 (postgresql:// 또는 postgres://로 시작)
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  console.log('🔍 PostgreSQL detected, updating schema.prisma and migration_lock.toml provider to postgresql');
  
  // schema.prisma 수정
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const updatedSchema = schemaContent.replace(
    /provider\s*=\s*["']sqlite["']/,
    'provider = "postgresql"'
  );
  writeFileSync(schemaPath, updatedSchema, 'utf-8');
  console.log('✅ schema.prisma updated to use postgresql');
  
  // migration_lock.toml 수정
  if (existsSync(migrationLockPath)) {
    try {
      const lockContent = readFileSync(migrationLockPath, 'utf-8');
      const updatedLock = lockContent.replace(
        /provider\s*=\s*["']sqlite["']/,
        'provider = "postgresql"'
      );
      writeFileSync(migrationLockPath, updatedLock, 'utf-8');
      console.log('✅ migration_lock.toml updated to use postgresql');
    } catch (error) {
      console.log('⚠️  Failed to update migration_lock.toml:', error.message);
    }
  } else {
    console.log('⚠️  migration_lock.toml not found, skipping');
  }
} else {
  console.log('🔍 SQLite detected, keeping provider as sqlite');
}


