export class TelegramInlineButton {
  text!: string;
  url!: string;
}

export class TelegramNotificationOptions {
  reply_markup?: {
    inline_keyboard: Array<Array<TelegramInlineButton>>;
  };
}

export interface TelegramJobData {
  chatId: string | number;
  message: string;
  options?: TelegramNotificationOptions;
}

export interface TelegramJobResult {
  success: boolean;
  message?: string;
  jobId?: string | number;
  error?: string;
  reason?: string;
}
