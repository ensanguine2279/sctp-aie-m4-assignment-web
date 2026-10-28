import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/auth";

// Never cache: every call must reach the services.
export const dynamic = "force-dynamic";

export type ServiceStatus = "up" | "down";

export interface ServiceHealth {
  status: ServiceStatus;
  /** Round trip from the BFF to the service, or null when it did not answer. */
  latencyMs: number | null;
  /** HTTP status the service answered with, or null on timeout or network error. */
  httpStatus: number | null;
}

export interface HealthResponse {
  users: ServiceHealth;
  tasks: ServiceHealth;
  checkedAt: string;
}

const TIMEOUT_MS = 3000;

const TARGETS = {
  users: `${process.env.USER_SERVICE_URL || "http://localhost:8022"}/api/users`,
  tasks: `${process.env.TASK_SERVICE_URL || "http://localhost:8077"}/api/tasks`,
};

/**
 * Probes one service with an unauthenticated GET.
 *
 * The actuator endpoints are blocked at Caddy, so this calls a protected API
 * route without a token instead. Spring Security answers 401 before any
 * controller or database work, which proves the application is running:
 *   - any status below 500 (normally 401): up
 *   - 502, 503, 504: Caddy reached no healthy replica, down
 *   - timeout or network error: the swarm or Caddy is unreachable, down
 * No token is sent, so the probe never reads data.
 */
async function probe(url: string): Promise<ServiceHealth> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return {
      status: res.status < 500 ? "up" : "down",
      latencyMs: Date.now() - started,
      httpStatus: res.status,
    };
  } catch {
    return { status: "down", latencyMs: null, httpStatus: null };
  }
}

export async function GET() {
  // Only signed-in users may trigger probes, so the route cannot be used
  // anonymously to generate traffic against the APIs.
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [users, tasks] = await Promise.all([
    probe(TARGETS.users),
    probe(TARGETS.tasks),
  ]);

  const body: HealthResponse = {
    users,
    tasks,
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
