"use client";

import { useActionState } from "react";

import { deleteUser, updateUserRole } from "@/lib/actions";

const rolesForAdmin = ["buyer", "seller"];
const rolesForSuperadmin = ["buyer", "seller", "admin", "superadmin"];

export default function UserActions({
  userId,
  currentRole,
  isSelf,
  canManageAdmins,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
  canManageAdmins: boolean;
}) {
  const [roleState, roleAction] = useActionState(updateUserRole, undefined);
  const [deleteState, deleteAction, deleting] = useActionState(deleteUser, undefined);

  const options = canManageAdmins ? rolesForSuperadmin : rolesForAdmin;

  return (
    <div className="flex items-center gap-2">
      <form action={roleAction} className="flex items-center gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <select
          name="role"
          defaultValue={currentRole}
          disabled={isSelf}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium capitalize text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </form>

      {roleState && "error" in roleState && (
        <span className="text-xs text-red-600">
          {String((roleState as { error: string }).error)}
        </span>
      )}
      {deleteState && "error" in deleteState && (
        <span className="text-xs text-red-600">
          {String((deleteState as { error: string }).error)}
        </span>
      )}

      {!isSelf && (
        <form action={deleteAction}>
          <input type="hidden" name="user_id" value={userId} />
          <button
            type="submit"
            disabled={deleting}
            onClick={(event) => {
              if (!confirm("Delete this user and all their data?")) {
                event.preventDefault();
              }
            }}
            className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
        </form>
      )}
    </div>
  );
}