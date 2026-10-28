import type { TaskDto, TaskPriority } from "@/lib/actions/tasks";
import type { UserDto } from "@/lib/actions/users";

export interface CountRow {
  key: string;
  label: string;
  value: number;
}

export interface TaskAnalytics {
  total: number;
  completed: number;
  open: number;
  /** Completed share of all tasks, 0-100, rounded. 0 when there are no tasks. */
  completionRate: number;
  byUser: CountRow[];
  byPriority: CountRow[];
}

/** Highest priority first, so the chart reads in order of urgency. */
const PRIORITY_ORDER: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

/**
 * Turns the raw task and user lists into the counts the analytics page draws.
 * Pure function: no fetching, so it is easy to test.
 */
export function summariseTasks(
  tasks: TaskDto[],
  users: UserDto[],
): TaskAnalytics {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const open = total - completed;

  // Tasks per user. Every user appears, including those with no tasks, so
  // an idle account is visible. Tasks whose owner no longer exists get their
  // own row instead of disappearing from the totals.
  const counts = new Map<number, number>();
  for (const task of tasks) {
    counts.set(task.userId, (counts.get(task.userId) ?? 0) + 1);
  }

  const knownIds = new Set(users.map((u) => u.id));
  const byUser: CountRow[] = users.map((u) => ({
    key: `user-${u.id}`,
    label: u.name || u.username,
    value: counts.get(u.id) ?? 0,
  }));
  for (const [userId, value] of counts) {
    if (!knownIds.has(userId)) {
      byUser.push({
        key: `user-${userId}`,
        label: `Unknown user #${userId}`,
        value,
      });
    }
  }
  byUser.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  const byPriority: CountRow[] = PRIORITY_ORDER.map((priority) => ({
    key: priority,
    label: PRIORITY_LABELS[priority],
    value: tasks.filter((t) => t.priority === priority).length,
  }));

  return {
    total,
    completed,
    open,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    byUser,
    byPriority,
  };
}
