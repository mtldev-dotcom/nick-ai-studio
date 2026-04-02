"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BottomNav } from "./BottomNav";

const navItems = [
  { href: "/gallery", label: "Gallery" },
  { href: "/generate", label: "Generate" },
  { href: "/settings", label: "Settings" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-6 md:gap-8">
              <Link href="/gallery" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-[#00e5c9] to-[#4a9eff] bg-clip-text text-transparent font-['Rajdhani']">
                  FalStudio
                </span>
              </Link>
              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      pathname === item.href || pathname?.startsWith(item.href + "/")
                        ? "bg-white/10 text-[#d8eaf5]"
                        : "text-[#8898a5] hover:text-[#b8cfdf] hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Email — hidden on very small screens */}
              <span className="hidden sm:block text-sm text-[#8898a5] truncate max-w-[160px]">
                {session?.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 text-xs md:text-sm text-[#8898a5] hover:text-[#b8cfdf] border border-white/10 rounded-md hover:border-white/20 transition-all whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content — add bottom padding on mobile for the bottom nav */}
      <main className="flex-1 bg-[#080808] pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
