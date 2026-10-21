import { getSessionClaims } from "@/lib/auth";
import { getUsers } from "@/lib/actions/users";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserTable from "./user-table";
import { ArrowLeft, Users, Eye, UserCheck } from "lucide-react";

export default async function UserManagementPage() {
  const session = await getSessionClaims();

  if (!session) {
    redirect("/login");
  }

  const roles = Array.isArray(session.roles) ? session.roles : [];
  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isManager = roles.includes("ROLE_MANAGER") || roles.includes("MANAGER");

  const users = await getUsers();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Orchestration
          </Link>

          <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-50 border border-purple-100 text-[#753991]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isAdmin || isManager
                    ? "User Management Directory"
                    : "My Profile Directory"}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage system access and authentication profiles
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Scope Status Banners */}
              {!isAdmin && isManager && (
                <span className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-medium border border-amber-200 bg-amber-50 text-[#ecad0a]">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Read-Only Mode
                </span>
              )}

              {!isAdmin && !isManager && (
                <span className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-medium border border-sky-200 bg-sky-50 text-[#209dd7]">
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  Personal Profile
                </span>
              )}

              {/* Connection Indicator */}
              <div className="inline-flex items-center px-3 py-2 text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
                <span className="relative flex h-2.5 w-2.5 mr-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span>User Microservice</span>
                  <span className="font-mono text-[10px] opacity-80 leading-tight mt-0.5">
                    (USER_SERVICE_URL)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <UserTable initialUsers={users} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
