"use client";

import { useState, useTransition } from "react";
import { UserDto } from "@/lib/actions/users";
import {
  TaskDto,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskCompletion,
} from "@/lib/actions/tasks";
import {
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Layers,
  Plus,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface TaskTableProps {
  initialTasks: TaskDto[];
  users: UserDto[];
  isAdmin: boolean;
  isManager: boolean;
  currentUserId: number;
}

export default function TaskTable({
  initialTasks,
  users,
  isAdmin,
  isManager,
  currentUserId,
}: TaskTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Only users with the "USER" role can be assigned tasks
  const assignableUsers = users.filter((u) => u.role === "USER");

  // Combined Filtering and Sorting Logic
  const filteredTasks = initialTasks
    .filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description &&
          t.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesUser =
        userFilter === "ALL" || t.userId.toString() === userFilter;

      const matchesPriority =
        priorityFilter === "ALL" || t.priority === priorityFilter;

      return matchesSearch && matchesUser && matchesPriority;
    })
    .sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );

  const handleDelete = (id: number) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await deleteTaskAction(id);
      if (res.error) setErrorMsg(res.error);
      else setDeletingTask(null);
    });
  };

  const handleToggle = (id: number, currentStatus: boolean) => {
    startTransition(() => {
      toggleTaskCompletion(id, !currentStatus);
    });
  };

  // Admins and Managers can full-edit (modal) and delete any task
  const canManage = isAdmin || isManager;

  // Standard users can toggle completion status for their own tasks; Admins/Managers can toggle any
  const canToggle = (taskUserId: number) =>
    canManage || taskUserId === currentUserId;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex flex-1 max-w-xl gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#209dd7] focus:border-[#209dd7]"
            />
          </div>

          {/* Priority Filter Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#209dd7] bg-white min-w-[120px]"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>

          {/* Assignee Filter Dropdown (Admin & Manager) */}
          {(isAdmin || isManager) && (
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#209dd7] bg-white min-w-[130px]"
            >
              <option value="ALL">All Assignees</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* New Task Button (Admin & Manager Only) */}
        {(isAdmin || isManager) && (
          <button
            onClick={() => {
              setErrorMsg("");
              setIsCreateOpen(true);
            }}
            className="bg-[#209dd7] hover:bg-[#1a84b8] text-white px-4 py-2 text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Task Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
              <th className="p-3">Title & Details</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assignee</th>
              <th className="p-3 w-12 text-center">Completed</th>
              {/* Hide Actions header for standard users */}
              {canManage && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No tasks found.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`hover:bg-gray-50/80 transition-colors ${task.completed ? "opacity-60" : ""}`}
                >
                  <td className="p-3">
                    <p
                      className={`font-semibold text-gray-900 ${task.completed ? "line-through text-gray-500" : ""}`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-gray-500 mt-0.5 truncate max-w-sm">
                        {task.description}
                      </p>
                    )}
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                        task.priority === "HIGH"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : task.priority === "MEDIUM"
                            ? "bg-amber-50 text-[#ecad0a] border-amber-200"
                            : "bg-sky-50 text-[#209dd7] border-sky-200"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td className="p-3 font-medium text-gray-700">
                    {users.find((u) => u.id === task.userId)?.name ||
                      `User #${task.userId}`}
                  </td>

                  {/* Completed Column: Allow toggle if canToggle returns true */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() =>
                        canToggle(task.userId) &&
                        handleToggle(task.id, task.completed)
                      }
                      disabled={!canToggle(task.userId)}
                      className={`transition-colors ${
                        canToggle(task.userId)
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                  </td>

                  {/* Conditionally render the entire td for Admins/Managers only */}
                  {canManage && (
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setErrorMsg("");
                          setEditingTask(task);
                        }}
                        className="p-1.5 border border-gray-200 text-gray-600 hover:text-[#209dd7] hover:border-[#209dd7] transition-colors cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTask(task)}
                        className="p-1.5 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Create New Task
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                const res = await createTaskAction(null, formData);
                if (res.error) setErrorMsg(res.error);
                else setIsCreateOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Update database schema"
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-semibold text-gray-600 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-semibold text-gray-600 mb-1">
                    Assignee
                  </label>
                  <select
                    name="userId"
                    defaultValue={currentUserId}
                    className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                  >
                    {assignableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#209dd7] text-white text-xs font-medium"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Edit Task #{editingTask.id}
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={async (formData) => {
                const res = await updateTaskAction(
                  editingTask.id,
                  null,
                  formData,
                );
                if (res.error) setErrorMsg(res.error);
                else setEditingTask(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  type="text"
                  defaultValue={editingTask.title}
                  required
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTask.description || ""}
                  rows={3}
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-semibold text-gray-600 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingTask.priority}
                    className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-semibold text-gray-600 mb-1">
                    Assignee
                  </label>
                  <select
                    name="userId"
                    defaultValue={editingTask.userId}
                    className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                  >
                    {assignableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center cursor-pointer w-max group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="completed"
                      value="true"
                      defaultChecked={editingTask.completed}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-300 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#209dd7]/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#209dd7]"></div>
                  </div>
                  <span className="ml-2 text-xs font-semibold uppercase text-gray-600 group-hover:text-gray-900 transition-colors">
                    Mark as Completed
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-gray-200 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#209dd7] text-white text-xs font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 shadow-lg w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              Confirm Deletion
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Delete task{" "}
              <strong className="font-semibold text-gray-900">
                &quot;{deletingTask.title}&quot;
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setDeletingTask(null)}
                className="px-4 py-2 border border-gray-200 text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={() => handleDelete(deletingTask.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
