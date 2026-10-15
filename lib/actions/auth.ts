"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface AuthState {
  error?: string;
}

export async function loginAction(
  prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  try {
    const userServiceUrl = process.env.USER_SERVICE_URL;
    const res = await fetch(`${userServiceUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.message || "Invalid username or password." };
    }

    const data = await res.json();
    const cookieStore = await cookies();

    cookieStore.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
    });
  } catch (err) {
    return { error: "Unable to connect to authentication service." };
  }

  // Next.js redirect must be called outside try/catch blocks
  redirect("/dashboard");
}
