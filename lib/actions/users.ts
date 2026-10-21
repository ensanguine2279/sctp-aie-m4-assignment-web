"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSessionClaims } from "@/lib/auth";

export type UserRole = "USER" | "MANAGER" | "ADMIN";

export interface UserDto {
  id: number;
  name: string;
  username: string;
  role: UserRole;
}

export interface UserFormState {
  error?: string;
  success?: boolean;
}

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:8022";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function verifyAdminRole(): Promise<boolean> {
  const session = await getSessionClaims();
  if (!session) return false;
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
}

// READ USERS (Role-Scoped Data Access)
export async function getUsers(): Promise<UserDto[]> {
  const session = await getSessionClaims();
  if (!session) return [];

  const roles = Array.isArray(session.roles) ? session.roles : [];
  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isManager = roles.includes("ROLE_MANAGER") || roles.includes("MANAGER");

  try {
    const headers = await getAuthHeader();

    // 1. ADMIN & MANAGER: Fetch full user directory
    if (isAdmin || isManager) {
      const res = await fetch(`${USER_SERVICE_URL}/api/users`, {
        headers,
        cache: "no-store",
      });

      if (!res.ok) return [];
      return await res.json();
    }

    // 2. Standard USER: Fetch only their own record by ID
    const res = await fetch(`${USER_SERVICE_URL}/api/users/${session.uid}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    const selfUser: UserDto = await res.json();
    return [selfUser];
  } catch (error) {
    console.error("Failed to fetch user directory:", error);
    return [];
  }
}

// CREATE USER (ADMIN ONLY)
export async function createUserAction(
  prevState: UserFormState | null,
  formData: FormData,
): Promise<UserFormState> {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) {
    return { error: "Forbidden: Only Administrators can create accounts." };
  }

  const name = (formData.get("name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as UserRole) || "USER";

  if (!name || !username || !password) {
    return { error: "Name, username, and password are mandatory." };
  }

  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${USER_SERVICE_URL}/api/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, username, password, role }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.message || "Failed to create user account." };
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Network error while connecting to User Service." };
  }
}

// UPDATE USER (ADMIN ONLY)
export async function updateUserAction(
  userId: number,
  prevState: UserFormState | null,
  formData: FormData,
): Promise<UserFormState> {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) {
    return { error: "Forbidden: Only Administrators can update accounts." };
  }

  const name = (formData.get("name") as string)?.trim();
  const role = formData.get("role") as UserRole;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  let method: string;
  let payload: Record<string, unknown>;

  // Conditionally construct payload and determine HTTP method
  if (!password) {
    method = "PATCH";
    payload = { username, name, role };
  } else {
    method = "PUT";
    payload = { username, name, role, password };
  }

  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${USER_SERVICE_URL}/api/users/${userId}`, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.message || "Failed to update user." };
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Network error while updating user." };
  }
}

// DELETE USER (ADMIN ONLY)
export async function deleteUserAction(userId: number): Promise<UserFormState> {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) {
    return { error: "Forbidden: Only Administrators can delete accounts." };
  }

  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${USER_SERVICE_URL}/api/users/${userId}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) return { error: "Failed to delete user account." };

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Network error deleting user." };
  }
}
