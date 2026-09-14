import type { Status } from "@/lib/database.types";

// Ported verbatim from the original tool's SR_INTERVALS constant (days).
export const SR_INTERVALS = [1, 3, 7, 14, 30, 90];

export const STATUS_LABELS: Record<Status, string> = {
  done: "Completed",
  active: "In progress",
  next: "Do next",
  todo: "To do",
};

export const REVIEW_QUALITY_LABELS = [
  "Rescheduled for tomorrow",
  "Got it — see you in 3 days",
  "Easy — next review in a week",
] as const;

export const REVIEW_QUALITY_BUTTONS = [
  { quality: 0, label: "Hard", iconKey: "effort" },
  { quality: 1, label: "Got it", iconKey: "check" },
  { quality: 2, label: "Easy", iconKey: "bolt" },
] as const;
