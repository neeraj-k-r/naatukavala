import Storefront, { type ShopFilters } from "@/components/Storefront";

function parseFilters(
  query: Record<string, string | string[] | undefined>,
): ShopFilters {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  return {
    q: first(query.q),
    category: first(query.category),
    sort: first(query.sort),
  };
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  return <Storefront slug={slug} filters={parseFilters(await searchParams)} />;
}
