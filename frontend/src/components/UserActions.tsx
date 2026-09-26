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
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium capitalize text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </form>

      {roleState && "error" in roleState && (
        <span className="text-xs text-red-600 dark:text-red-400">
          {String((roleState as { error: string }).error)}
        </span>
      )}
      {deleteState && "error" in deleteState && (
        <span className="text-xs text-red-600 dark:text-red-400">
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
              if (
                !confirm(
                  "Delete this user? Their shop and products vanish from the marketplace at once. Sellers with order history cannot be deleted — suspend their shop instead.",
                )
              ) {
                event.preventDefault();
              }
            }}
            className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </form>
      )}
    </div>
  );
}