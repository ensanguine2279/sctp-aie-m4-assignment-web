"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSessionClaims } from "@/lib/auth";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskDto {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  completed: boolean;
  userId: number;
}

export interface TaskFormState {
  error?: string;
  success?: boolean;
}

const TASK_SERVICE_URL =
  process.env.TASK_SERVICE_URL || "http://localhost:8077";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getTasks(): Promise<TaskDto[]> {
  const session = await getSessionClaims();
  if (!session) return [];

  const roles = Array.isArray(session.roles) ? session.roles : [];
  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isManager = roles.includes("ROLE_MANAGER") || roles.includes("MANAGER");

  try {
    const headers = await getAuthHeader();

    // Admin and Manager can see all tasks. Standard users see their own.
    const url =
      isAdmin || isManager
        ? `${TASK_SERVICE_URL}/api/tasks`
        : `${TASK_SERVICE_URL}/api/tasks/user/${session.uid}`;

    const res = await fetch(url, { headers, cache: "no-store" });

    console.log("Fetching tasks response: " + url);

    if (!res.ok) return [];

    return await res.json();
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return [];
  }
}

export async function createTaskAction(
  prevState: TaskFormState | null,
  formData: FormData,
): Promise<TaskFormState> {
  const session = await getSessionClaims();
  if (!session) return { error: "Unauthorized" };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || "";
  const priority = (formData.get("priority") as TaskPriority) || "MEDIUM";
  // Admins can assign tasks to others; users assign to themselves
  const assignedUserId = formData.get("userId")
    ? Number(formData.get("userId"))
    : session.uid;

  if (!title) return { error: "Task title is mandatory." };

  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${TASK_SERVICE_URL}/api/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title,
        description,
        priority,
        completed: false,
        userId: assignedUserId,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.message || "Failed to create task." };
    }

    revalidatePath("/dashboard/tasks");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Network error creating task.",
    };
  }
}

export async function updateTaskAction(
  id: number,
  prevState: TaskFormState | null,
  formData: FormData,
): Promise<TaskFormState> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priority = formData.get("priority") as TaskPriority;
  const completed = formData.get("completed") === "true";
  const userId = Number(formData.get("userId"));

  console.log("Updating task with data:", {
    title,
    description,
    priority,
    completed,
    userId,
  });

  if (!title) return { error: "Task title is mandatory." };

  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${TASK_SERVICE_URL}/api/tasks/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ title, description, priority, completed, userId }),
    });

    console.log("Response from update task:", res);

    if (!res.ok) return { error: "Failed to update task." };

    revalidatePath("/dashboard/tasks");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Network error updating task.",
    };
  }
}

export async function deleteTaskAction(id: number): Promise<TaskFormState> {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${TASK_SERVICE_URL}/api/tasks/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) return { error: "Failed to delete task." };

    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Network error deleting task.",
    };
  }
}

export async function toggleTaskCompletion(
  id: number,
  completed: boolean,
): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await fetch(`${TASK_SERVICE_URL}/api/tasks/${id}/complete`, {
      method: "PATCH",
      headers,
      //body: JSON.stringify({ completed }),
    });
    revalidatePath("/dashboard/tasks");
  } catch (error) {
    console.error("Error toggling status:", error);
  }
}
