"use client";

import { useActionState } from "react";

import { markNotificationRead } from "@/lib/actions";

export default function NotificationReadButton({
  notificationId,
}: {
  notificationId: string;
}) {
  const [, action, pending] = useActionState(markNotificationRead, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="notification_id" value={notificationId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Mark read
      </button>
    </form>
  );
}
