import { getSessionClaims } from "@/lib/auth";
import { getTasks } from "@/lib/actions/tasks";
import { getUsers } from "@/lib/actions/users"; // Import getUsers
import { redirect } from "next/navigation";
import TaskTable from "./task-table";
import { Layers } from "lucide-react";
import ServiceStatus from "@/components/service-status";

export default async function TaskManagementPage() {
  const session = await getSessionClaims();

  if (!session) {
    redirect("/login");
  }

  const roles = Array.isArray(session.roles) ? session.roles : [];
  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isManager = roles.includes("ROLE_MANAGER") || roles.includes("MANAGER");

  // Fetch both tasks and users concurrently for better performance
  const [tasks, users] = await Promise.all([getTasks(), getUsers()]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <div className="bg-white border border-gray-200 p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-sky-50 border border-sky-100 text-[#209dd7]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Task Registry
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage organizational tasks and assignments
                </p>
              </div>
            </div>

            {/* Live connection indicator, polls /api/health */}
            <div className="flex items-center">
              <ServiceStatus service="tasks" label="Task Microservice" />
            </div>
          </div>
        </div>

        <TaskTable
          initialTasks={tasks}
          users={users} // Pass users down
          isAdmin={isAdmin}
          isManager={isManager}
          currentUserId={session.uid ? Number(session.uid) : 0}
        />
      </div>
    </div>
  );
}
