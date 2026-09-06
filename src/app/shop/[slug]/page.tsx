import Storefront from "@/components/Storefront";

export default async function ShopFallbackPage({
  params,
}: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  return <Storefront slug={slug} />;
}