import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  throw new Error('JWT_SECRET is required but was not provided in environment.');
}

export const env = Object.freeze({
  PORT: Number(process.env.PORT) || 4000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER || 'medicap_app',
  DB_PASSWORD: process.env.DB_PASSWORD || 'medicap_pass',
  DB_NAME: process.env.DB_NAME || 'medicap',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  NEAR_EXPIRY_DAYS: Number(process.env.NEAR_EXPIRY_DAYS) || 30,
  SIM_TICK_MS: Number(process.env.SIM_TICK_MS) || 1000,
  SIM_SPEED: Number(process.env.SIM_SPEED) || 60,
  ROAD_FACTOR: process.env.ROAD_FACTOR !== undefined ? Number(process.env.ROAD_FACTOR) : 1.3,
  TRUCK_SPEED_KMH: Number(process.env.TRUCK_SPEED_KMH) || 60,
  STOP_DWELL_MIN: Number(process.env.STOP_DWELL_MIN) || 15,
  WEATHER_CACHE_MIN: Number(process.env.WEATHER_CACHE_MIN) || 10,
  TEMP_LOG_INTERVAL_SEC: Number(process.env.TEMP_LOG_INTERVAL_SEC) || 30,
  WEATHER_OFFLINE: process.env.WEATHER_OFFLINE === 'true',
  COOLING_OFFSET_C: process.env.COOLING_OFFSET_C !== undefined ? Number(process.env.COOLING_OFFSET_C) : 0,
  AUTO_CONFIRM_RECEIPT: process.env.AUTO_CONFIRM_RECEIPT === 'true',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
});

export default env;
