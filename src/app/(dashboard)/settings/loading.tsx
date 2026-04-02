export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="h-8 w-48 rounded-xl bg-white/5 animate-pulse" />
      {[1, 2].map((i) => (
        <div key={i} className="mc-card rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-5 w-32 rounded bg-white/5" />
          <div className="h-12 w-full rounded-xl bg-white/5" />
          <div className="h-12 w-full rounded-xl bg-white/5" />
        </div>
      ))}
    </div>
  );
}
