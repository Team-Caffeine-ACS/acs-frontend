export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-4 w-56 animate-pulse rounded-full bg-slate-200" />
      <div className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <div className="h-[420px] animate-pulse rounded-[28px] bg-slate-100" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-slate-100" />
      </div>
    </div>
  );
}
