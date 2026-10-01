export interface EmailJobData {
  destinatario: string;
  asunto: string;
  mensaje: string;
}

export interface EmailJobResult {
  success: boolean;
  message?: string;
  jobId?: string | number;
  error?: string;
  reason?: string;
}

export interface MailError extends Error {
  code?: string | number;
  responseCode?: number;
  command?: string;
}
