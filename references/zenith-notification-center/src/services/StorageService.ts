import { DEFAULT_STORAGE_KEY } from "../constants";
import type { NotificationItem } from "../types";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const getStorage = (): StorageLike | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export class StorageService {
  constructor(private readonly key = DEFAULT_STORAGE_KEY) {}

  read(): NotificationItem[] {
    const storage = getStorage();
    if (!storage) return [];

    try {
      const value = storage.getItem(this.key);
      if (!value) return [];
      return JSON.parse(value) as NotificationItem[];
    } catch {
      return [];
    }
  }

  write(notifications: NotificationItem[]): void {
    const storage = getStorage();
    if (!storage) return;

    storage.setItem(this.key, JSON.stringify(notifications));
  }

  clear(): void {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem(this.key);
  }
}
