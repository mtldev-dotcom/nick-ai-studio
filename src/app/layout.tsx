import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Providers } from "@/components/Providers";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "FalStudio - AI Generation Workspace",
  description: "Generate stunning images and videos with Fal.ai. All assets are automatically saved to your private R2 bucket.",
  keywords: ["AI", "image generation", "video generation", "Fal.ai", "Flux", "Stable Diffusion"],
  authors: [{ name: "FalStudio" }],
  openGraph: {
    title: "FalStudio - AI Generation Workspace",
    description: "Generate stunning images and videos with Fal.ai",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rajdhani.variable} antialiased`}>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}