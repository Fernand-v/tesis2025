import { createPool, Pool } from 'mysql2/promise';

import config from '../config/env';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
};

export default getPool;
