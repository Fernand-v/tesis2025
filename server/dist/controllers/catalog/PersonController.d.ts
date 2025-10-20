import type { Request, Response } from 'express';
declare const PersonController: {
    list: (_req: Request, res: Response) => Promise<void>;
    detail: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
    addType: (req: Request, res: Response) => Promise<void>;
    removeType: (req: Request, res: Response) => Promise<void>;
};
export default PersonController;
//# sourceMappingURL=PersonController.d.ts.map