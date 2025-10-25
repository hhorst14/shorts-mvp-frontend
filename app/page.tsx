"use client";

import { useEffect, useRef, useState } from "react";
import { Field } from "@/components/Field";
import TrimControl from "@/components/TrimControl";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type UploadResp = { video_id: string };
type MetaResp = { video_id: string; path: string; duration_ms: number | null };
type TranscribeResp = { language: string; num_segments: number };
type ExportReq = {
  video_id: string;
  aspect: "9:16" | "1:1" | "16:9";
  fit: "letterbox" | "crop";
  style: "clean" | "creator";
  burn_in: boolean;
  trim_start_ms: number;
  trim_end_ms: number | null;
};
type ExportResp = { output_path: string };

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");

  const [aspect, setAspect] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [fit, setFit] = useState<"letterbox" | "crop">("letterbox");
  const [style, setStyle] = useState<"clean" | "creator">("clean");
  const [burnIn, setBurnIn] = useState<boolean>(true);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null); // ISO code or null for auto


  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoURL(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const upload = async () => {
    if (!file) return;
    setStatus("Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
    if (!res.ok) {
      setStatus("Upload failed");
      return;
    }
    const data = (await res.json()) as UploadResp;
    setVideoId(data.video_id);
    setStatus(`Uploaded (id=${data.video_id})`);
    // fetch meta for duration
    const metaRes = await fetch(`${API_BASE}/videos/${data.video_id}`);
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as MetaResp;
      setDurationMs(meta.duration_ms ?? 0);
      setTrimStart(0);
      setTrimEnd(meta.duration_ms ?? null);
    }
  };

 const transcribe = async () => {
  if (!videoId) return;
  setStatus("Transcribing...");

  const payload: any = {
    video_id: videoId,
    start_ms: trimStart,
    end_ms: trimEnd,
  };
  if (language) payload.language = language;

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  if (!res.ok) {
    setStatus(`Transcribe failed: ${raw}`);
    return;
  }
  const data = JSON.parse(raw) as TranscribeResp;
  setStatus(`Transcribed (${data.language}, ${data.num_segments} segments).`);
};
  
  const replaceTranscript = async () => {
    if (!videoId) return;
    setStatus("Replacing transcript...");
    const res = await fetch(`${API_BASE}/transcript`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId, text: transcript }),
    });
    if (!res.ok) {
      const err = await res.text();
      setStatus(`Replace failed: ${err}`);
      return;
    }
    setStatus("Transcript updated.");
  };

  const doExport = async () => {
    if (!videoId) return;
    setStatus("Exporting...");
    const payload: ExportReq = {
      video_id: videoId,
      aspect,
      fit,
      style,
      burn_in: burnIn,
      trim_start_ms: trimStart,
      trim_end_ms: trimEnd,
    };
    const res = await fetch(`${API_BASE}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      setStatus(`Export failed: ${err}`);
      return;
    }
    // const data = (await res.json()) as ExportResp;
    // setStatus("Export done.");
    // // If backend serves DATA_DIR under /files, open the file
    // const url = data.output_path.replace(/.*\/data\//, "/files/");
    // window.open(`${API_BASE}${url}`, "_blank");

    const data = (await res.json()) as { output_path: string; public_url: string };
    const full = `${API_BASE}${data.public_url}`;
    setStatus("Export done.");
    setExportUrl(full); // show a “Download exported MP4” link in the UI
    // optionally auto-open:
    window.open(full, "_blank");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Shorts MVP</h1>
      <p className="text-zinc-400">Upload a clip, transcribe, adjust, and export a Shorts-ready MP4.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <Field label="1) Upload video">
            <input className="input w-full" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button className="btn mt-2" onClick={upload} disabled={!file}>Upload</button>
          </Field>

          <div>
          <div className="label mb-1">Language (for transcription)</div>
          <select
            className="select w-full"
            value={language ?? ""}
            onChange={(e) => setLanguage(e.target.value || null)}
          >
            <option value="">Auto-detect</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="nl">Dutch</option>
            <option value="pt">Portuguese</option>
            <option value="it">Italian</option>
            <option value="hi">Hindi</option>
            <option value="ar">Arabic</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            {/* add more as needed */}
          </select>
        </div>

          <Field label="2) Auto-transcribe (multi-language)">
            <button className="btn" onClick={transcribe} disabled={!videoId}>Transcribe</button>
          </Field>

          <Field label="3) Optional: paste/replace transcript (to fix errors)">
            <textarea className="textarea w-full h-32" placeholder="Paste original transcript here..." value={transcript} onChange={(e) => setTranscript(e.target.value)} />
            <button className="btn mt-2" onClick={replaceTranscript} disabled={!videoId || !transcript.trim()}>Replace Transcript</button>
          </Field>

          <Field label="4) Export options">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="label mb-1">Aspect</div>
                <select className="select w-full" value={aspect} onChange={(e) => setAspect(e.target.value as any)}>
                  <option value="9:16">9:16 (vertical)</option>
                  <option value="1:1">1:1 (square)</option>
                  <option value="16:9">16:9 (horizontal)</option>
                </select>
              </div>
              <div>
                <div className="label mb-1">Fit</div>
                <select className="select w-full" value={fit} onChange={(e) => setFit(e.target.value as any)}>
                  <option value="letterbox">Letterbox</option>
                  <option value="crop">Crop to fill</option>
                </select>
              </div>
              <div>
                <div className="label mb-1">Style</div>
                <select className="select w-full" value={style} onChange={(e) => setStyle(e.target.value as any)}>
                  <option value="clean">Clean</option>
                  <option value="creator">Creator</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" id="burn" checked={burnIn} onChange={(e) => setBurnIn(e.target.checked)} />
                <label htmlFor="burn" className="label">Burn-in subtitles</label>
              </div>
            </div>
          </Field>

          <Field label="5) Trim start/end">
            <TrimControl
              durationMs={durationMs}
              startMs={trimStart}
              endMs={trimEnd}
              onChange={(s, e) => {
                setTrimStart(s);
                setTrimEnd(e);
              }}
            />
          </Field>

          <button className="btn" disabled={!videoId} onClick={doExport}>Export MP4</button>

          

          <div className="text-sm text-zinc-400">
            {status}
            {exportUrl && (
              <div className="mt-2">
                <a href={exportUrl} target="_blank" rel="noreferrer" className="underline">
                  Download exported MP4
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="card space-y-3">
          <div className="label">Preview (local file)</div>
          {videoURL ? (
            <video
              ref={videoRef}
              className="w-full rounded-xl"
              src={videoURL}
              controls
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (isFinite(v.duration)) {
                  const d = Math.floor(v.duration * 1000);
                  // Only update if we don't already have duration from backend
                  if (!durationMs) setDurationMs(d);
                  if (!trimEnd) setTrimEnd(d);
                }
              }}
            />
          ) : (
            <div className="text-zinc-500">No video selected yet.</div>
          )}
          <p className="text-zinc-400 text-sm">
            Note: Captions preview is not rendered client-side in this MVP. Final burn-in happens on export via backend.
          </p>
        </div>
      </div>
    </div>
  );
}
