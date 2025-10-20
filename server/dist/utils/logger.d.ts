import type { Request } from 'express';
interface LogEntry {
    section: string;
    statusCode: number;
    message: string;
    detail?: string;
    ip?: string;
    method?: string;
    url?: string;
    timestamp?: Date;
    username?: string | null;
    userId?: number | null;
    priority?: number | undefined;
    program?: string | null;
}
declare const writeLog: (entry: LogEntry) => Promise<void>;
export declare const logRequestEvent: (req: Request, data: {
    section: string;
    statusCode: number;
    message: string;
    detail?: string;
    priority?: number;
    program?: string | null;
}) => Promise<void>;
export default writeLog;
//# sourceMappingURL=logger.d.ts.map