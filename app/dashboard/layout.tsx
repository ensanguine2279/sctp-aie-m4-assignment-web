// app/dashboard/layout.tsx
import { getSessionClaims } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  UserCheck,
  Layers,
  Users,
  BarChart3,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionClaims();

  if (!session) {
    redirect("/login");
  }

  const roles = Array.isArray(session.roles) ? session.roles : [];
  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isManager = roles.includes("ROLE_MANAGER") || roles.includes("MANAGER");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Shared Global Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Brand Logo & Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="font-bold text-sm tracking-tight text-gray-900"
            >
              TaskFlow{" "}
              <span className="text-[#209dd7] font-normal">Enterprise</span>
            </Link>
            <nav className="flex items-center space-x-4 text-xs font-medium text-gray-600 border-l border-gray-200 pl-6">
              <Link
                href="/dashboard/users"
                className="hover:text-[#753991] transition-colors flex items-center"
              >
                <Users className="w-3.5 h-3.5 mr-1" /> Users
              </Link>
              <Link
                href="/dashboard/tasks"
                className="hover:text-[#209dd7] transition-colors flex items-center"
              >
                <Layers className="w-3.5 h-3.5 mr-1" /> Tasks
              </Link>
              {(isAdmin || isManager) && (
                <Link
                  href="/dashboard/analytics"
                  className="hover:text-[#753991] transition-colors flex items-center"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1" /> Analytics
                </Link>
              )}
            </nav>
          </div>

          {/* Right: Identity Details, Dynamic Role Badge, Logout */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-gray-500">
              Logged in as{" "}
              <strong className="font-semibold text-gray-900">
                {session.sub}
              </strong>{" "}
              <span className="font-mono text-gray-600">
                (ID: #{session.uid})
              </span>
            </span>

            {/* Dynamic Role Badge */}
            {isAdmin ? (
              <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium border border-purple-200 bg-purple-50 text-[#753991]">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Administrator
              </span>
            ) : isManager ? (
              <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium border border-amber-200 bg-amber-50 text-[#ecad0a]">
                <Eye className="w-3.5 h-3.5 mr-1" />
                Manager
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium border border-sky-200 bg-sky-50 text-[#209dd7]">
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Standard User
              </span>
            )}

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}
