"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const env_1 = __importDefault(require("../../config/env"));
const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});
const sanitizeFilename = (value) => value.replace(/[^a-zA-Z0-9-_]/g, '_');
const formatTimestamp = (date) => {
    const parts = TIMESTAMP_FORMATTER.formatToParts(date).reduce((acc, part) => {
        if (part.type !== 'literal') {
            acc[part.type] = part.value;
        }
        return acc;
    }, {});
    const dateStr = `${parts.year ?? '0000'}${parts.month ?? '00'}${parts.day ?? '00'}`;
    const timeStr = `${parts.hour ?? '00'}${parts.minute ?? '00'}${parts.second ?? '00'}`;
    return `${dateStr}_${timeStr}`;
};
class BackupService {
    static async createDatabaseDump() {
        const timestamp = formatTimestamp(new Date());
        const baseName = sanitizeFilename(env_1.default.database.name);
        const filename = `${baseName}_backup_${timestamp}.sql`;
        const outputPath = path_1.default.join(os_1.default.tmpdir(), filename);
        const args = [
            `-h${env_1.default.database.host}`,
            `-P${env_1.default.database.port}`,
            `-u${env_1.default.database.user}`,
            `-p${env_1.default.database.password}`,
            '--routines',
            '--events',
            '--single-transaction',
            '--quick',
            env_1.default.database.name,
        ];
        await new Promise((resolve, reject) => {
            const dump = (0, child_process_1.spawn)('mysqldump', args, { stdio: ['ignore', 'pipe', 'pipe'] });
            const writeStream = (0, fs_1.createWriteStream)(outputPath);
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
                }
                else {
                    reject(new Error(stderr || `mysqldump finalizo con codigo ${code}`));
                }
            });
        });
        return { filePath: outputPath, filename };
    }
    static async cleanup(tempPath) {
        try {
            await fs_1.promises.unlink(tempPath);
        }
        catch {
            // No action required if deletion fails.
        }
    }
}
exports.default = BackupService;
//# sourceMappingURL=BackupService.js.map