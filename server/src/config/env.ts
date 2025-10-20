import dotenv from 'dotenv';

dotenv.config();

const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Falta configurar la variable de entorno ${key}`);
  }
});

const jwtExpiresInHours = Number(process.env.JWT_EXPIRES_IN_HOURS);
const normalizedJwtHours = Number.isNaN(jwtExpiresInHours) || jwtExpiresInHours <= 0 ? 4 : jwtExpiresInHours;
const jwtExpiresInSeconds = Math.floor(normalizedJwtHours * 60 * 60);

const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: jwtExpiresInSeconds,
  database: {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    name: process.env.DB_NAME as string,
  },
  reportService: {
    url: process.env.REPORT_SERVICE_URL ?? 'http://localhost:5555/report',
  },
};

export default config;
