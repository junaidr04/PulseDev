export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta || '');
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta || '');
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta || '');
  },
};
export default logger;
