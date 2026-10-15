"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center space-x-2 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 hover:text-red-600 text-xs font-medium transition-colors cursor-pointer"
      title="Sign out of current session"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{isPending ? "Signing out..." : "Logout"}</span>
    </button>
  );
}
