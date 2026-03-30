"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signIn("credentials", {
      email,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/gallery");
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="mc-card mc-card-teal p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#d8eaf5] font-['Rajdhani'] mb-6 text-center">
          Sign In to FalStudio
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#b8cfdf] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00e5c9] text-[#080808] font-medium rounded-lg hover:bg-[#00e5c9]/90 transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-xs text-[#8898a5] mt-4 text-center">
          Enter any email to sign in. No password required for demo.
        </p>
      </div>
    </div>
  );
}
