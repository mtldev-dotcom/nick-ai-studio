"use client";

import { useState, useEffect } from "react";
import { Loader, Check, AlertCircle } from "@/components/ui/icons";

interface SettingsData {
  falApiKey: string | null;
  r2AccessKey: string | null;
  r2SecretKey: string | null;
  r2Endpoint: string | null;
  r2BucketName: string | null;
  updatedAt: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    falApiKey: null,
    r2AccessKey: null,
    r2SecretKey: null,
    r2Endpoint: null,
    r2BucketName: null,
    updatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [falApiKey, setFalApiKey] = useState("");
  const [r2AccessKey, setR2AccessKey] = useState("");
  const [r2SecretKey, setR2SecretKey] = useState("");
  const [r2Endpoint, setR2Endpoint] = useState("");
  const [r2BucketName, setR2BucketName] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setR2Endpoint(data.r2Endpoint || "");
        setR2BucketName(data.r2BucketName || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          falApiKey: falApiKey || undefined,
          r2AccessKey: r2AccessKey || undefined,
          r2SecretKey: r2SecretKey || undefined,
          r2Endpoint: r2Endpoint || undefined,
          r2BucketName: r2BucketName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSaved(true);
      setFalApiKey("");
      setR2AccessKey("");
      setR2SecretKey("");
      setSettings(data);

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded w-1/3" />
          <div className="h-64 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#d8eaf5] font-['Rajdhani'] mb-2">
          Settings
        </h1>
        <p className="text-[#8898a5]">
          Configure your Fal.ai API key and Cloudflare R2 storage credentials.
        </p>
      </div>

      <div className="space-y-6">
        <div className="mc-card mc-card-teal p-6">
          <h2 className="text-lg font-semibold text-[#d8eaf5] mb-4">Fal.ai API Key</h2>
          <p className="text-sm text-[#8898a5] mb-4">
            Get your API key from{" "}
            <a
              href="https://fal.ai/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4a9eff] hover:underline"
            >
              fal.ai/dashboard
            </a>
          </p>
          <input
            type="password"
            value={falApiKey}
            onChange={(e) => setFalApiKey(e.target.value)}
            placeholder={settings.falApiKey || "sk-..."}
            className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 font-mono"
          />
          {settings.falApiKey && (
            <p className="text-xs text-[#8898a5] mt-2">
              Current key: {settings.falApiKey}
            </p>
          )}
        </div>

        <div className="mc-card mc-card-blue p-6">
          <h2 className="text-lg font-semibold text-[#d8eaf5] mb-4">Cloudflare R2 Storage</h2>
          <p className="text-sm text-[#8898a5] mb-4">
            Configure your R2 bucket for persistent asset storage. R2 provides zero egress fees.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#b8cfdf] mb-2">Endpoint URL</label>
              <input
                type="text"
                value={r2Endpoint}
                onChange={(e) => setR2Endpoint(e.target.value)}
                placeholder="https://xxx.r2.cloudflarestorage.com"
                className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b8cfdf] mb-2">Bucket Name</label>
              <input
                type="text"
                value={r2BucketName}
                onChange={(e) => setR2BucketName(e.target.value)}
                placeholder="my-falstudio-bucket"
                className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#b8cfdf] mb-2">Access Key ID</label>
                <input
                  type="password"
                  value={r2AccessKey}
                  onChange={(e) => setR2AccessKey(e.target.value)}
                  placeholder={settings.r2AccessKey || "AKIA..."}
                  className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[#b8cfdf] mb-2">Secret Access Key</label>
                <input
                  type="password"
                  value={r2SecretKey}
                  onChange={(e) => setR2SecretKey(e.target.value)}
                  placeholder={settings.r2SecretKey || "••••••••"}
                  className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[#ff5240]/10 border border-[#ff5240]/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#ff5240]" />
            <p className="text-sm text-[#ff5240]">{error}</p>
          </div>
        )}

        {saved && (
          <div className="p-4 bg-[#00e5c9]/10 border border-[#00e5c9]/20 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-[#00e5c9]" />
            <p className="text-sm text-[#00e5c9]">Settings saved successfully!</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#00e5c9] text-[#080808] font-medium rounded-lg hover:bg-[#00e5c9]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader className="w-5 h-5" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>

        <div className="mc-card p-4 border-white/5">
          <h3 className="text-sm font-medium text-[#b8cfdf] mb-2">Security Note</h3>
          <p className="text-xs text-[#8898a5]">
            All credentials are encrypted with AES-256 before being stored in the database.
            They are never exposed to the client-side and are only used for server-side operations.
          </p>
        </div>
      </div>
    </div>
  );
}
