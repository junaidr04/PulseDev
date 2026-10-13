export interface EmailJobPayload {
  to: string;
  subject: string;
  template: 'welcome' | 'sprint-assigned' | 'security-alert';
  context: Record<string, unknown>;
}

export class EmailQueue {
  private queue: EmailJobPayload[] = [];

  async add(jobName: string, payload: EmailJobPayload) {
    this.queue.push(payload);
    return { id: `job_${Date.now()}`, name: jobName, status: 'queued' };
  }

  getPendingCount() {
    return this.queue.length;
  }
}

export const emailQueue = new EmailQueue();
