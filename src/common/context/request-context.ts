import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  method?: string;
  url?: string;
  userAgent?: string;
}

export const requestContextStorage =
  new AsyncLocalStorage<RequestContextStore>();

export class RequestContext {
  static get(): RequestContextStore | undefined {
    return requestContextStorage.getStore();
  }

  static getRequestId(): string | undefined {
    return requestContextStorage.getStore()?.requestId;
  }

  static getUserId(): string | undefined {
    return requestContextStorage.getStore()?.userId;
  }

  static getUserEmail(): string | undefined {
    return requestContextStorage.getStore()?.userEmail;
  }

  static getIp(): string | undefined {
    return requestContextStorage.getStore()?.ip;
  }

  static getUserAgent(): string | undefined {
    return requestContextStorage.getStore()?.userAgent;
  }

  static setUserId(userId: string): void {
    const store = requestContextStorage.getStore();
    if (store) {
      store.userId = userId;
    }
  }

  static setUser(userId: string, userEmail?: string): void {
    const store = requestContextStorage.getStore();
    if (store) {
      store.userId = userId;
      if (userEmail) {
        store.userEmail = userEmail;
      }
    }
  }
}

