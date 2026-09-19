import mysql from "mysql2/promise";
import { env } from "./env.config";

const sslConfig = env.DB.SSL ? { ssl: { rejectUnauthorized: true } } : {};

export const pool = mysql.createPool({
  host: env.DB.HOST,
  port: env.DB.PORT,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,
  waitForConnections: true,
  connectionLimit: env.DB.CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true,
  ...sslConfig,
});

export const dbRootConnection = mysql.createPool({
  host: env.DB.HOST,
  port: env.DB.PORT,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  waitForConnections: true,
  connectionLimit: 5,
  ...sslConfig,
});
