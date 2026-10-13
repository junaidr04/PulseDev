import { EmailJobPayload } from '../queues/email.queue.js';
import logger from '../../config/logger.js';

export const processEmailWorker = async (payload: EmailJobPayload) => {
  logger.info(`Processing background email job for ${payload.to}`, {
    subject: payload.subject,
    template: payload.template,
  });
  return { delivered: true, timestamp: new Date().toISOString() };
};
