import NotificationReadButton from "@/components/NotificationReadButton";
import { requireAdmin } from "@/lib/auth";
import { getAdminNotifications } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";

export const metadata = {
  title: "Alerts",
};

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const notifications = await getAdminNotifications();
  const unread = notifications.filter(
    (notification) => !notification.is_read,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Alerts</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Shops that aren&apos;t accepting orders. Unconfirmed orders are
          cancelled automatically after 24 hours and counted here.
        </p>
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No alerts. Shops are accepting their orders on time.
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border p-5 shadow-sm ${
                notification.is_read
                  ? "border-slate-100 bg-white opacity-70 dark:border-slate-800 dark:bg-slate-900"
                  : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {notification.shop_name ?? "A shop"}{" "}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      · {notification.order_count} order
                      {notification.order_count === 1 ? "" : "s"} unaccepted
                    </span>
                  </p>
                  {notification.message && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {notification.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Updated {formatDate(notification.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notification.shop_slug && (
                    <a
                      href={shopUrl(notification.shop_slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
                    >
                      View shop
                    </a>
                  )}
                  {!notification.is_read && (
                    <NotificationReadButton notificationId={notification.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {unread.length === 0 && notifications.length > 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">All caught up.</p>
      )}
    </div>
  );
}
