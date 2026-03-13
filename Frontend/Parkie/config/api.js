export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  POLLING_INTERVAL: parseInt(process.env.POLLING_INTERVAL, 10) || 5000,
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS, 10) || 5,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY, 10) || 1000,
  TIMEOUT: parseInt(process.env.TIMEOUT, 10) || 5000,
};
