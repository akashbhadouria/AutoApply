"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen px-6 py-8 xl:px-10">
      <div className="mx-auto max-w-2xl pt-16">
        <Card className="p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
              <AlertTriangle className="size-5 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Runtime Recovery
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                Page crashed, shell is still healthy
              </h1>
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-300">
            Dev mode me kisi component ka runtime error aane par pura route broken ya unstyled lag
            sakta hai. Styling pipeline usually theek hoti hai, lekin page render fail ho jata hai.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Error
            </p>
            <p className="mt-2 break-words text-sm text-slate-300">
              {error.message || "Unknown runtime error"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reset} variant="primary">
              <RefreshCw className="size-4" />
              Retry route
            </Button>
            <Link href="/">
              <Button variant="secondary">Go to dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
