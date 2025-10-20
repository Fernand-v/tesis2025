import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

import routes from './routes';
import { logRequestEvent } from './utils/logger';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Servidor operativo' });
});

app.use((req: Request, res: Response) => {
  void logRequestEvent(req, {
    section: 'ROUTING',
    statusCode: 404,
    message: 'Recurso no encontrado',
  });
  res.status(404).json({ message: 'Recurso no encontrado' });
});

app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  void logRequestEvent(req, {
    section: 'ERROR',
    statusCode: 500,
    message: 'Error interno del servidor',
    detail: error.message,
  });
  res.status(500).json({ message: 'Error interno del servidor', detail: error.message });
});

export default app;
