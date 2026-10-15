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
    return null;
  }
}
