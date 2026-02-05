import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { EntityProvider } from "@/contexts/EntityContext";

export const metadata: Metadata = {
  title: "Arc PO Demo - Purchase Order Automation",
  description: "Intelligent Purchase Order generation system for boat manufacturing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <EntityProvider>
          <Navigation />
          <main className="min-h-screen bg-white">
            {children}
          </main>
        </EntityProvider>
      </body>
    </html>
  );
}

