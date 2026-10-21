"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/app/admin/actions";

const MAX_SIDE = 1800;

/** Shrinks a photo to at most 1800px on its longest side and re-encodes it as WebP. */
async function resize(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/webp", 0.85));
}

async function upload(file: File) {
  const blob = await resize(file);
  const form = new FormData();
  form.set("file", new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: blob.type || "image/webp" }));
  const res = await uploadImage(form);
  if (!res.url) throw new Error(res.error ?? "Upload failed");
  return res.url;
}

function useUploader(onUploaded: (urls: string[]) => void) {
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setBusy(files.length);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      try {
        urls.push(await upload(f));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
      setBusy((n) => n - 1);
    }
    if (urls.length) onUploaded(urls);
  };
  return { busy, error, pick };
}

/** Product photo manager: upload several, reorder, remove, or paste a link. The first photo is the main one. */
export function GalleryField({ name, initial }: { name: string; initial: string[] }) {
  const [images, setImages] = useState(initial);
  const [link, setLink] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { busy, error, pick } = useUploader((urls) => setImages((cur) => [...cur, ...urls]));
  const move = (i: number, d: number) =>
    setImages((cur) => {
      const next = [...cur];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={name} value={images.join("\n")} />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={src + i} className="group relative overflow-hidden rounded-xl border border-line bg-sand">
            <img src={src} alt="" className="aspect-[3/4] w-full object-cover" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">Main</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 p-2 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <div className="flex gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, -1)} className="rounded-md bg-white/90 px-2 py-1 text-xs" title="Move left">
                    ←
                  </button>
                )}
                {i < images.length - 1 && (
                  <button type="button" onClick={() => move(i, 1)} className="rounded-md bg-white/90 px-2 py-1 text-xs" title="Move right">
                    →
                  </button>
                )}
              </div>
              <button type="button" onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))} className="rounded-md bg-white/90 px-2 py-1 text-xs text-red-600">
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy > 0}
          className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#d9d4ca] text-sm text-muted hover:border-ink hover:text-ink"
        >
          <span className="text-2xl">+</span>
          {busy > 0 ? `Uploading ${busy}…` : "Upload photos"}
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => (pick(e.target.files), (e.target.value = ""))} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste an image link (https://…)" className="input text-sm" />
        <button
          type="button"
          onClick={() => {
            if (link.trim()) setImages((cur) => [...cur, link.trim()]);
            setLink("");
          }}
          className="shrink-0 rounded-lg border border-line px-3 text-sm hover:border-ink"
        >
          Add link
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">The first photo is the main image. Photos are resized automatically, so you can upload straight from your phone.</p>
    </div>
  );
}

/** A single image (collection cover, hero image) with upload, link and remove. */
export function ImageField({ name, initial, aspect = "aspect-[3/4]" }: { name: string; initial: string; aspect?: string }) {
  const [src, setSrc] = useState(initial);
  const input = useRef<HTMLInputElement>(null);
  const { busy, error, pick } = useUploader((urls) => setSrc(urls[0]));

  return (
    <div className="flex items-start gap-4">
      <input type="hidden" name={name} value={src} />
      <button type="button" onClick={() => input.current?.click()} className={`w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-sand ${aspect}`}>
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <span className="text-sm text-muted">No image</span>}
      </button>
      <div className="flex-1 space-y-2">
        <button type="button" onClick={() => input.current?.click()} disabled={busy > 0} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">
          {busy > 0 ? "Uploading…" : src ? "Replace image" : "Upload image"}
        </button>
        <input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="…or paste an image link" className="input text-sm" />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => (pick(e.target.files), (e.target.value = ""))} />
    </div>
  );
}
