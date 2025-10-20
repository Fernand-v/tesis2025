interface BackupResult {
    filePath: string;
    filename: string;
}
export default class BackupService {
    static createDatabaseDump(): Promise<BackupResult>;
    static cleanup(tempPath: string): Promise<void>;
}
export {};
//# sourceMappingURL=BackupService.d.ts.map