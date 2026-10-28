"use client";

import { useEffect, useState } from "react";
import type { HealthResponse } from "@/app/api/health/route";

/** How often to re-check while the tab is visible. */
const POLL_MS = 15_000;

type DisplayStatus = "checking" | "up" | "down" | "unknown";

interface State {
  status: DisplayStatus;
  latencyMs: number | null;
  checkedAt: Date | null;
}

const STYLES: Record<
  DisplayStatus,
  { box: string; dot: string; ping: boolean; text: (s: State) => string }
> = {
  checking: {
    box: "border-gray-200 bg-gray-50 text-gray-600",
    dot: "bg-gray-400",
    ping: false,
    text: () => "Checking…",
  },
  up: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    ping: true,
    text: (s) => (s.latencyMs != null ? `Online · ${s.latencyMs} ms` : "Online"),
  },
  down: {
    box: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    ping: false,
    text: () => "Unreachable",
  },
  unknown: {
    box: "border-gray-200 bg-gray-50 text-gray-600",
    dot: "bg-gray-400",
    ping: false,
    text: () => "Status unknown",
  },
};

/**
 * Live status badge for one microservice. Polls the BFF's /api/health route
 * every 15 seconds, pauses while the tab is hidden, and re-checks as soon as
 * the tab is shown again.
 */
export default function ServiceStatus({
  service,
  label,
}: {
  service: "users" | "tasks";
  label: string;
}) {
  const [state, setState] = useState<State>({
    status: "checking",
    latencyMs: null,
    checkedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        // The health route itself failed (for example, the session expired):
        // that says nothing about the service, so do not show it as down.
        if (!res.ok) {
          if (!cancelled) {
            setState({ status: "unknown", latencyMs: null, checkedAt: new Date() });
          }
          return;
        }
        const data: HealthResponse = await res.json();
        const health = data[service];
        if (!cancelled) {
          setState({
            status: health.status,
            latencyMs: health.latencyMs,
            checkedAt: new Date(data.checkedAt),
          });
        }
      } catch {
        // The browser could not reach the web app's own server.
        if (!cancelled) {
          setState({ status: "unknown", latencyMs: null, checkedAt: new Date() });
        }
      }
    }

    function start() {
      if (timer) return;
      check();
      timer = setInterval(check, POLL_MS);
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = undefined;
    }

    function onVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [service]);

  const style = STYLES[state.status];
  const title = state.checkedAt
    ? `Last checked ${state.checkedAt.toLocaleTimeString()}`
    : "Checking service status";

  return (
    <div
      className={`inline-flex items-center px-3 py-2 text-xs font-medium border ${style.box}`}
      title={title}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5 mr-2.5 shrink-0" aria-hidden>
        {style.ping && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.dot}`}></span>
      </span>
      <div className="flex flex-col">
        <span>{label}</span>
        <span className="font-mono text-[10px] opacity-80 leading-tight mt-0.5">
          {style.text(state)}
        </span>
      </div>
    </div>
  );
}
