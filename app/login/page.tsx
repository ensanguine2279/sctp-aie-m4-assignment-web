"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Enables/disables the permanently visible button based on user input
  const isFormValid = username.trim() !== "" && password.trim() !== "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="bg-white p-8 border border-gray-200 shadow-sm w-full max-w-md">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gray-100 p-3 rounded-full mb-3 text-[#209dd7]">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Sign In
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Enter your credentials to access your portal
          </p>
        </div>

        {/* Server Action Error Banner */}
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 mb-6 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                name="username"
                type="text"
                autoComplete="username"
                className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#753991] focus:border-[#753991] transition-colors"
                placeholder="e.g. admin01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#753991] focus:border-[#753991] transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Permanently visible button with enabled/disabled state */}
          <button
            type="submit"
            disabled={!isFormValid || isPending}
            className={`w-full font-medium py-2.5 text-sm transition-colors block text-center ${
              isFormValid && !isPending
                ? "bg-[#209dd7] hover:bg-[#1a81b3] text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
