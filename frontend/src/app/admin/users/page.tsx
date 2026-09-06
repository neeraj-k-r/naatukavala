import { requireAdmin } from "@/lib/auth";
import { getAllUsers } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import UserActions from "@/components/UserActions";

export const metadata = {
  title: "Users & roles",
};

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const users = await getAllUsers();

  const canManageAdmins = user.role === "superadmin";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Users & roles</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage accounts and roles. Only the superadmin can promote to admin.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((userRow) => (
              <tr key={userRow.id}>
                <td className="px-5 py-3">
                  <p className="font-semibold text-slate-800">
                    {userRow.full_name || "—"}
                  </p>
                  <p className="text-xs text-slate-400">{userRow.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      userRow.role === "superadmin"
                        ? "bg-fuchsia-100 text-fuchsia-800"
                        : userRow.role === "admin"
                          ? "bg-indigo-100 text-indigo-800"
                          : userRow.role === "seller"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {userRow.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {formatDate(userRow.created_at)}
                </td>
                <td className="px-5 py-3">
                  <UserActions
                    userId={userRow.id}
                    currentRole={userRow.role}
                    isSelf={userRow.id === user.id}
                    canManageAdmins={canManageAdmins}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}