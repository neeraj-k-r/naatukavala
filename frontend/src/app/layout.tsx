import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/components/CartContext";
import { getUser } from "@/lib/auth";
import { getShopBySlug } from "@/lib/api";
import { getShopSlugFromHost } from "@/lib/subdomain";

import type { Shop } from "@/lib/types";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Naatukavala — Every local shop, online",
    template: "%s · Naatukavala",
  },
  description:
    "A marketplace for local shop-owners and small vendors. Browse products from every shop and buy online.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();

  // On a shop subdomain (myshop.naatukavala.com) the whole visit is that
  // shop's private website — brand the navbar/footer for the shop. Fails
  // closed to the normal marketplace chrome.
  let siteShop: Shop | null = null;
  try {
    const slug = getShopSlugFromHost((await headers()).get("host"));
    if (slug) siteShop = (await getShopBySlug(slug))?.shop ?? null;
  } catch {
    siteShop = null;
  }

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 font-sans">
        <CartProvider>
          <Navbar user={user} siteShop={siteShop} />
          <main className="flex-1">{children}</main>
          <Footer siteShop={siteShop} />
        </CartProvider>
      </body>
    </html>
  );
}