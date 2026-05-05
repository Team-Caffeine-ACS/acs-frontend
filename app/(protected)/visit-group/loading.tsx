export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="h-5 w-60 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="space-y-2">
        <div className="h-10 w-80 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-5 w-96 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="h-12 w-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
