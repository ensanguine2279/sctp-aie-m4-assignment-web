import { getSessionClaims } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserCheck, Shield, Key } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSessionClaims();

  // Next.js redirect must run outside try/catch blocks
  if (!session) {
    redirect("/login");
  }

  // Safe fallback for roles array
  const rolesList =
    Array.isArray(session.roles) && session.roles.length > 0
      ? session.roles.map((role) => role.replace("ROLE_", "")).join(", ")
      : "No roles assigned";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm p-8">
        {/* Header Section */}
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-6 mb-6">
          <div className="p-2.5 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              Welcome, {session.sub}!
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Active Session Details
            </p>
          </div>
        </div>

        {/* User Identity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-200 flex items-center space-x-3">
            <Key className="w-5 h-5 text-brand-amber flex-shrink-0" />
            <div>
              <span className="block text-xs uppercase font-semibold text-gray-500 tracking-wider">
                User ID
              </span>
              <span className="font-mono text-sm text-gray-900 font-medium">
                #{session.uid}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 flex items-center space-x-3">
            <Shield className="w-5 h-5 text-brand-purple flex-shrink-0" />
            <div>
              <span className="block text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Assigned Roles
              </span>
              <span className="text-sm font-medium text-gray-900">
                {rolesList}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
