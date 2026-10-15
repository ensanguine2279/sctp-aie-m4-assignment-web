import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Edit2,
  Trash2,
  CheckSquare,
  Plus,
  ListFilter,
  UserCheck,
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export default async function TasksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const userId = cookieStore.get("user_id")?.value;

  if (!token || !userId) {
    redirect("/login");
  }

  let tasks: Task[] = [];
  let error = "";

  try {
    const taskServiceUrl =
      process.env.TASK_SERVICE_URL || "http://localhost:8082";

    const res = await fetch(`${taskServiceUrl}/api/v1/tasks/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      redirect("/login");
    }

    if (!res.ok) throw new Error("Failed to fetch assigned tasks");
    tasks = await res.json();
  } catch (err: unknown) {
    if (err instanceof Error) {
      error = err.message;
    } else {
      error = "An unexpected error occurred while loading tasks.";
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-brand-purple/10 text-brand-purple border border-brand-purple/20";
      case "IN_PROGRESS":
        return "bg-brand-blue/10 text-brand-blue border border-brand-blue/20";
      default:
        return "bg-brand-amber/10 text-gray-800 border border-brand-amber/30";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-brand-amber/10 border border-brand-amber/20 text-brand-amber rounded-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">
              TaskMaster Enterprise
            </span>
          </div>

          <nav className="flex items-center space-x-6 text-sm font-medium">
            <div className="flex items-center space-x-1.5 text-brand-blue border-b-2 border-brand-blue pb-0.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-brand-blue" />
              <span>Assigned Tasks</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Managing queue for user ID:{" "}
              <span className="font-mono text-gray-700">{userId}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
              <ListFilter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-1.5 bg-brand-blue text-white px-4 py-2 text-sm font-medium hover:bg-[#1a81b3] transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Crisp Data Table (4-sided subtle border, no single-side accent lines) */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">Task Title</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length === 0 && !error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No tasks found in your queue.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      #{task.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                      {task.description}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusBadge(task.status)}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-brand-amber hover:bg-gray-100 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-brand-purple hover:bg-gray-100 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
