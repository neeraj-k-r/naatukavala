import Storefront from "@/components/Storefront";

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Storefront slug={slug} />;
}