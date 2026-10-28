import {
  getSessionClaims,
  hasAdminRole,
  hasManagerRole,
  homePathFor,
} from "@/lib/auth";
import { getTasks } from "@/lib/actions/tasks";
import { getUsers } from "@/lib/actions/users";
import { summariseTasks } from "@/lib/analytics";
import {
  BarList,
  ChartCard,
  CompletionMeter,
  StatTile,
} from "@/components/charts";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

// Always read fresh numbers; never serve a cached page to another admin.
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getSessionClaims();

  if (!session) {
    redirect("/login");
  }

  // Administrators and managers only. Anyone else goes to their own page.
  const roles = Array.isArray(session.roles) ? session.roles : [];
  if (!hasAdminRole(roles) && !hasManagerRole(roles)) {
    redirect(homePathFor(roles));
  }

  // Admins and managers get every task and every user from the two APIs, so the counts
  // are computed here in the BFF; neither API needs a new endpoint.
  const [tasks, users] = await Promise.all([getTasks(), getUsers()]);
  const stats = summariseTasks(tasks, users);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <div className="bg-white border border-gray-200 p-6 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-purple-50 border border-purple-100 text-[#753991]">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Task Analytics
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Workload and progress across all users. Administrators and managers only.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Total tasks" value={stats.total} />
          <StatTile
            label="Completed"
            value={`${stats.completionRate}%`}
            hint={`${stats.completed} of ${stats.total}`}
          />
          <StatTile
            label="Users"
            value={users.length}
            hint={`${stats.byUser.filter((r) => r.value > 0).length} with tasks`}
          />
        </div>

        <ChartCard
          title="Completed vs not completed"
          description="Share of all tasks marked complete."
        >
          <CompletionMeter
            completed={stats.completed}
            open={stats.open}
            completionRate={stats.completionRate}
          />
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Tasks by user"
            description="Number of tasks assigned to each user, most first."
          >
            <BarList
              rows={stats.byUser}
              labelHeader="User"
              emptyMessage="No users found."
            />
          </ChartCard>

          <ChartCard
            title="Tasks by priority"
            description="Number of tasks at each priority."
          >
            <BarList rows={stats.byPriority} labelHeader="Priority" />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
