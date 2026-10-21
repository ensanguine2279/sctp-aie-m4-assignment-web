import { getSessionClaims } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { ShieldCheck } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSessionClaims();

  if (!session) {
    redirect("/login");
  }

  const userRoles = Array.isArray(session.roles) ? session.roles : [];
  const isAdmin =
    userRoles.includes("ROLE_ADMIN") || userRoles.includes("ADMIN");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Banner with Logout Button */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              <span>Enterprise Admin Portal</span>
              <span>•</span>
              <span className="text-[#209dd7]">TaskFlow v1.0</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              System Operations
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Logged in as{" "}
              <span className="font-semibold text-gray-700">{session.sub}</span>{" "}
              (ID: #{session.uid})
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-purple-200 bg-purple-50 text-[#753991]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              {isAdmin ? "Administrator" : "Manager / User"}
            </span>

            {/* Logout Button Component */}
            <LogoutButton />
          </div>
        </div>

        {/* Rest of Dashboard UI... */}
      </div>
    </div>
  );
}
