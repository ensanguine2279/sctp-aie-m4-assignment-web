import "server-only";
import { cookies } from "next/headers";
import { decodeJwt } from "jose"; // or jwtVerify with JWKS

export interface SessionClaims {
  sub: string;
  uid: string;
  roles: string[];
  exp?: number;
}

/**
 * Helper function for Server Components & Middleware.
 * Reads the HttpOnly auth_token cookie and decodes claims.
 */
export async function getSessionClaims(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const claims = decodeJwt(token);

    return {
      sub: (claims.sub as string) || "",
      uid: (claims.uid as string) || (claims.sub as string) || "",
      roles: Array.isArray(claims.roles) ? (claims.roles as string[]) : [],
      exp: claims.exp,
    };
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

/** True when the roles claim contains the administrator role. */
export function hasAdminRole(roles: string[]): boolean {
  return roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
}

/** True when the roles claim contains the manager role. */
export function hasManagerRole(roles: string[]): boolean {
  return roles.includes("ROLE_MANAGER") || roles.includes("MANAGER");
}

/**
 * The page each role lands on after login (and when opening the site root):
 * administrators manage users, managers watch progress, users work on tasks.
 */
export function homePathFor(roles: string[]): string {
  if (hasAdminRole(roles)) return "/dashboard/users";
  if (hasManagerRole(roles)) return "/dashboard/analytics";
  return "/dashboard/tasks";
}
