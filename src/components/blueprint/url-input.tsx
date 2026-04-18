"use client";

import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface UrlInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ value, onValueChange, onSubmit, isLoading }: UrlInputProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    onSubmit(withProtocol);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <Input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="https://company.com"
        disabled={isLoading}
        className="h-11 flex-1 bg-zinc-900/60 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 font-mono text-sm"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="h-11 px-5 rounded-md bg-emerald-500 text-zinc-950 text-sm font-medium hover:bg-emerald-400 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 disabled:active:scale-100 flex items-center gap-2 whitespace-nowrap"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />
            Auditing…
          </>
        ) : (
          "Generate Blueprint"
        )}
      </button>
    </form>
  );
}
