import { describe, expect, it } from "vitest";
import { applyFilter } from "../src/utils/filtering";
import type { NotificationItem } from "../src/types";

const item = (id: string, read = false): NotificationItem => ({
  id,
  title: `title-${id}`,
  message: "message",
  timestamp: Date.now(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  type: "info",
  category: "general",
  priority: "medium",
  status: "new",
  read,
  archived: false,
  starred: false,
  pinned: false
});

describe("applyFilter", () => {
  it("filters unread notifications", () => {
    const list = [item("1", false), item("2", true)];
    const result = applyFilter(list, { unread: true });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });
});
