import type { Status } from "@/lib/database.types";

export const STATUS_LABELS: Record<Status, string> = {
  done: "Completed",
  active: "In progress",
  next: "Do next",
  todo: "To do",
};
