"use client";

import { useEffect } from "react";

export default function TrimControl({
  durationMs,
  startMs,
  endMs,
  onChange,
}: {
  durationMs: number;
  startMs: number;
  endMs: number | null;
  onChange: (start: number, end: number | null) => void;
}) {
  const max = durationMs ?? 0;
  const end = endMs ?? max;

  useEffect(() => {
    if (endMs === null && durationMs > 0) {
      onChange(startMs, durationMs);
    }
  }, [durationMs]);

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Start: {fmt(startMs)}</span>
        <span>End: {fmt(end)}</span>
        <span>Length: {fmt(Math.max(0, end - startMs))}</span>
      </div>
      <div className="flex gap-3">
        <input
          className="w-full"
          type="range"
          min={0}
          max={max}
          step={100}
          value={startMs}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= end) return;
            onChange(v, endMs);
          }}
        />
        <input
          className="w-full"
          type="range"
          min={0}
          max={max}
          step={100}
          value={end}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= startMs) return;
            onChange(startMs, v);
          }}
        />
      </div>
    </div>
  );
}
