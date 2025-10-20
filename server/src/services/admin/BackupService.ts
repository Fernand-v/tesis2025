import { createWriteStream, promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

import config from '../../config/env';

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '_');

const formatTimestamp = (date: Date) => {
  const parts = TIMESTAMP_FORMATTER.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {} as Record<string, string>);

  const dateStr = `${parts.year ?? '0000'}${parts.month ?? '00'}${parts.day ?? '00'}`;
  const timeStr = `${parts.hour ?? '00'}${parts.minute ?? '00'}${parts.second ?? '00'}`;
  return `${dateStr}_${timeStr}`;
};

interface BackupResult {
  filePath: string;
  filename: string;
}

export default class BackupService {
  static async createDatabaseDump(): Promise<BackupResult> {
    const timestamp = formatTimestamp(new Date());
    const baseName = sanitizeFilename(config.database.name);
    const filename = `${baseName}_backup_${timestamp}.sql`;
    const outputPath = path.join(os.tmpdir(), filename);

    const args = [
      `-h${config.database.host}`,
      `-P${config.database.port}`,
      `-u${config.database.user}`,
      `-p${config.database.password}`,
      '--routines',
      '--events',
      '--single-transaction',
      '--quick',
      config.database.name,
    ];

    await new Promise<void>((resolve, reject) => {
      const dump = spawn('mysqldump', args, { stdio: ['ignore', 'pipe', 'pipe'] });

      const writeStream = createWriteStream(outputPath);
      let stderr = '';

      dump.stdout.pipe(writeStream);

      dump.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      dump.on('error', (error) => {
        reject(error);
      });

      dump.on('close', (code) => {
        if (code === 0) {
          writeStream.end(() => resolve());
        } else {
          reject(new Error(stderr || `mysqldump finalizo con codigo ${code}`));
        }
      });
    });

    return { filePath: outputPath, filename };
  }

  static async cleanup(tempPath: string): Promise<void> {
    try {
      await fs.unlink(tempPath);
    } catch {
      // No action required if deletion fails.
    }
  }
}
