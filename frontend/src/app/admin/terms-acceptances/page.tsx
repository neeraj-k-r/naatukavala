import { Suspense } from "react";

import { adminFetch } from "@/lib/api";
import TermsAcceptancesTable from "./TermsAcceptancesTable";

export const metadata = {
  title: "Terms Acceptances",
};

export default async function TermsAcceptancesPage({
  searchParams,
}: PageProps<"/admin/terms-acceptances">) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Math.max(1, Math.min(200, Number(params.limit ?? 50)));

  const data = await adminFetch<{
    acceptances: {
      id: string;
      user_id: string;
      version: string;
      accepted_at: string;
      user_email: string | null;
      user_name: string | null;
    }[];
    total: number;
  }>(`/admin/terms-acceptances?page=${page}&limit=${limit}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Terms & Conditions Acceptances
      </h1>
      <Suspense fallback={<TableSkeleton />}>
        <TermsAcceptancesTable
          acceptances={data.acceptances}
          total={data.total}
          page={page}
          limit={limit}
        />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                Version
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                Accepted At
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-2/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}