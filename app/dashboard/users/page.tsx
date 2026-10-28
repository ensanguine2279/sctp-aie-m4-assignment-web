import { getSessionClaims } from "@/lib/auth";
import { getUsers } from "@/lib/actions/users";
import { redirect } from "next/navigation";
import UserTable from "./user-table";
import { Users, Eye, UserCheck } from "lucide-react";
import ServiceStatus from "@/components/service-status";

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

              {/* Live connection indicator, polls /api/health */}
              <ServiceStatus service="users" label="User Microservice" />
            </div>
          </div>
        </div>

        <UserTable initialUsers={users} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
