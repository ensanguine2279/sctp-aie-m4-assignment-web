"use client";

import { useState, useTransition } from "react";
import {
  UserDto,
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/lib/actions/users";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Shield,
  X,
  AlertCircle,
  Users,
} from "lucide-react";

interface UserTableProps {
  initialUsers: UserDto[];
  isAdmin: boolean;
}

export default function UserTable({ initialUsers, isAdmin }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const filteredUsers = initialUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = (id: number) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await deleteUserAction(id);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setDeletingUser(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#753991] focus:border-[#753991]"
          />
        </div>

        {/* Create button rendered ONLY for Administrators */}
        {isAdmin && (
          <button
            onClick={() => {
              setErrorMsg("");
              setIsCreateOpen(true);
            }}
            className="bg-[#753991] hover:bg-[#602e77] text-white px-4 py-2 text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users Data Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
              <th className="p-3">ID</th>
              <th className="p-3">Full Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">Role</th>
              {isAdmin && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
                  className="p-8 text-center text-gray-400"
                >
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No user accounts found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="p-3 font-mono text-gray-500">#{user.id}</td>
                  <td className="p-3 text-gray-900 font-medium">{user.name}</td>
                  <td className="p-3 font-semibold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-purple-100 border border-purple-200 text-[#753991] flex items-center justify-center font-mono font-bold text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-mono text-xs">{user.username}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium border ${
                        user.role === "ADMIN"
                          ? "bg-purple-50 text-[#753991] border-purple-200"
                          : user.role === "MANAGER"
                            ? "bg-amber-50 text-[#ecad0a] border-amber-200"
                            : "bg-sky-50 text-[#209dd7] border-sky-200"
                      }`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                  </td>

                  {/* Actions column rendered ONLY for Administrators */}
                  {isAdmin && (
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setErrorMsg("");
                          setEditingUser(user);
                        }}
                        className="p-1.5 border border-gray-200 text-gray-600 hover:text-[#209dd7] hover:border-[#209dd7] transition-colors cursor-pointer"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="p-1.5 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                        title="Delete User"
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

      {/* CREATE USER MODAL (Admin Only) */}
      {isAdmin && isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Create User Account
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
                const res = await createUserAction(null, formData);
                if (res.error) setErrorMsg(res.error);
                else setIsCreateOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Full Name{" "}
                  <span className="text-gray-400 font-normal">
                    (2-50 characters)
                  </span>
                </label>
                <input
                  name="name"
                  type="text"
                  minLength={2}
                  maxLength={50}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#753991]"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Username{" "}
                  <span className="text-gray-400 font-normal">
                    (6-20 lowercase alphanumeric)
                  </span>
                </label>
                <input
                  name="username"
                  type="text"
                  pattern="[a-z0-9]+"
                  minLength={6}
                  maxLength={20}
                  required
                  placeholder="e.g. john2026"
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#753991]"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Password{" "}
                  <span className="text-gray-400 font-normal">
                    (8-72 characters)
                  </span>
                </label>
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  required
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#753991]"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  User Role
                </label>
                <select
                  name="role"
                  defaultValue="USER"
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#753991]"
                >
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
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
                  className="px-4 py-2 bg-[#753991] text-white text-xs font-medium"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL (Admin Only) */}
      {isAdmin && editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Edit User: @{editingUser.username}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={async (formData) => {
                const res = await updateUserAction(
                  editingUser.id,
                  null,
                  formData,
                );
                if (res.error) setErrorMsg(res.error);
                else setEditingUser(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingUser.name}
                  minLength={2}
                  maxLength={50}
                  required
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  New Password{" "}
                  <span className="text-gray-400 font-normal">
                    (Leave blank to keep unchanged)
                  </span>
                </label>
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-gray-600 mb-1">
                  User Role
                </label>
                <select
                  name="role"
                  defaultValue={editingUser.role}
                  className="w-full border border-gray-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
                >
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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

      {/* DELETE CONFIRMATION MODAL (Admin Only) */}
      {isAdmin && deletingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 shadow-lg w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              Confirm Deletion
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete user account{" "}
              <strong className="font-mono text-gray-900">
                @{deletingUser.username}
              </strong>{" "}
              (ID:{" "}
              <span className="font-mono text-gray-700">
                #{deletingUser.id}
              </span>
              )? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-gray-200 text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={() => handleDelete(deletingUser.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
              >
                {isPending ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
