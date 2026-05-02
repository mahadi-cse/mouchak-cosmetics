import type { Metadata } from "next";
import AuthProvider from "@/shared/providers/AuthProvider";
import QueryProvider from "@/shared/providers/QueryProvider";
import { CartProvider } from "@/shared/contexts/CartContext";
import { WishlistProvider } from "@/shared/contexts/WishlistContext";
import { CartDrawer } from "@/shared/components/CartDrawer";
import { WishlistDrawer } from "@/shared/components/WishlistDrawer";
import ColorThemeProvider from "@/shared/providers/ColorThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mouchak Cosmetics",
  description: "Premium cosmetics for everyone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <QueryProvider>
            <CartProvider>
              <WishlistProvider>
                <ColorThemeProvider />
                {children}
                <CartDrawer />
                <WishlistDrawer />
              </WishlistProvider>
            </CartProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
