import { Suspense } from "react";

import { fetchApi } from "@/lib/api";
import TermsAcceptancesTable from "./TermsAcceptancesTable";
import { AdminTableSkeleton, AdminPageHeaderSkeleton } from "@/components/AdminSkeletons";

export const metadata = {
  title: "Terms Acceptances",
};

async function TermsAcceptancesContent({
  searchParams,
}: { searchParams: Promise<{ page?: string; limit?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Math.max(1, Math.min(200, Number(params.limit ?? 50)));

  const data = await fetchApi<{
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Terms & Conditions Acceptances
      </h1>
      <TermsAcceptancesTable
        acceptances={data.acceptances}
        total={data.total}
        page={page}
        limit={limit}
      />
    </div>
  );
}

export default async function TermsAcceptancesPage({
  searchParams,
}: { searchParams: Promise<{ page?: string; limit?: string }> }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<AdminPageHeaderSkeleton />}>
        <TermsAcceptancesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}