type StorageArea = 'local' | 'session';

const memoryStorage = new Map<string, string>();

export function isBrowser(): boolean {
  try {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  } catch {
    return false;
  }
}

export function safeUUID(): string {
  try {
    const cryptoApi = globalThis.crypto as Crypto & { randomUUID?: () => string };
    if (typeof cryptoApi?.randomUUID === 'function') {
      const id = cryptoApi.randomUUID.call(cryptoApi);
      if (typeof id === 'string' && id.length > 0) return id;
    }
  } catch {
    // Continue through the available UUID generation options.
  }

  try {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  } catch {
    try {
      const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0'));
      return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
    } catch {
      return '00000000-0000-4000-8000-000000000000';
    }
  }
}

export async function safeCopy(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Older and embedded browsers often reject clipboard access.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy');
    } finally {
      textarea.remove();
    }
  } catch {
    return false;
  }
}

function storageFor(area: StorageArea): Storage {
  return area === 'session' ? window.sessionStorage : window.localStorage;
}

function memoryKey(area: StorageArea, key: string): string {
  return `${area}:${key}`;
}

export const safeStorage = {
  get(key: string, area: StorageArea = 'local'): string | null {
    try {
      const value = storageFor(area).getItem(key);
      if (value !== null) return value;
    } catch {
      // Private browsing and embedded webviews may disable storage.
    }
    return memoryStorage.get(memoryKey(area, key)) ?? null;
  },

  set(key: string, value: string, area: StorageArea = 'local'): boolean {
    try {
      storageFor(area).setItem(key, value);
      return true;
    } catch {
      memoryStorage.set(memoryKey(area, key), value);
      return false;
    }
  },

  remove(key: string, area: StorageArea = 'local'): void {
    memoryStorage.delete(memoryKey(area, key));
    try {
      storageFor(area).removeItem(key);
    } catch {
      // Removal remains best-effort if storage is unavailable.
    }
  },
};

export async function withTimeoutSignal<T>(
  timeoutMs: number,
  operation: (signal: AbortSignal | undefined) => Promise<T>
): Promise<T> {
  if (typeof AbortController !== 'function') return operation(undefined);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}
