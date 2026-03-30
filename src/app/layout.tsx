import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./theme.css";

export const metadata: Metadata = {
  title: "FalStudio Cloud",
  description: "Persistent AI Generation Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
