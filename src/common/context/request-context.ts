import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
  userId?: string;
  ip?: string;
  method?: string;
  url?: string;
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

  static setUserId(userId: string): void {
    const store = requestContextStorage.getStore();
    if (store) {
      store.userId = userId;
    }
  }
}
