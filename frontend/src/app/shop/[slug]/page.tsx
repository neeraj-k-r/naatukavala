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

export default async function ShopFallbackPage({
  params,
  searchParams,
}: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const query = (await searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  return <Storefront slug={slug} filters={parseFilters(query)} />;
}
