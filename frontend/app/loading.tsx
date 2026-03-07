export default function Loading() {
  return (
    <main className="min-h-screen px-6 py-8 xl:px-10">
      <div className="mb-10">
        <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
        <div className="mt-4 h-10 w-[320px] rounded-2xl bg-white/[0.06]" />
        <div className="mt-3 h-4 w-[420px] max-w-full rounded-full bg-white/[0.04]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-[110px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
          />
        ))}
      </div>
    </main>
  );
}
