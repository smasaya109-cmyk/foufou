"use client";

import { useState } from "react";
import useSWR from "swr";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase-client";
import { fetchWithAuth } from "@/lib/client-api";
import { swrFetcher } from "@/lib/swr";
import { useLang } from "@/hooks/useLang";

export default function PhotoGallery({ groupId }: { groupId: string }) {
  const lang = useLang();
  const { data, mutate } = useSWR(`/api/groups/${groupId}/photos`, swrFetcher, {
    revalidateOnFocus: false
  });
  const photos = data?.photos ?? [];
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(file: File) {
    setPending(true);
    setError(null);
    setProgress(0);
    try {
      const path = `groups/${groupId}/photos/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      const url = await new Promise<string>((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(percent);
          },
          (err) => reject(err),
          async () => {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });
      await fetchWithAuth(`/api/groups/${groupId}/photos`, {
        method: "POST",
        body: JSON.stringify({ url, name: file.name })
      });
      await mutate();
    } catch (err: any) {
      setError(err?.message ?? (lang === "en" ? "Upload failed." : "アップロードに失敗しました。"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{lang === "en" ? "Photo sharing" : "写真共有"}</p>
          <p className="text-sm text-muted">
            {lang === "en" ? "Share your trip memories." : "旅行の思い出を共有できます。"}
          </p>
        </div>
        <label className="btn-primary text-sm">
          {pending
            ? `${lang === "en" ? "Uploading" : "アップロード中"}... ${progress}%`
            : lang === "en"
              ? "Upload"
              : "アップロード"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
      </div>
      {pending ? (
        <div className="h-2 w-full rounded-full bg-[var(--bg-soft)]">
          <div
            className="h-2 rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {photos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo: any) => (
            <div key={photo.id} className="overflow-hidden rounded-2xl border border-[var(--stroke)] bg-white">
              <img src={photo.url} alt={photo.name ?? "photo"} className="h-48 w-full object-cover" />
              <div className="flex items-center justify-between px-3 py-2 text-xs text-muted">
                <span>{photo.name ?? (lang === "en" ? "Untitled" : "写真")}</span>
                <a
                  href={photo.url}
                  download
                  className="rounded-full border border-[var(--stroke)] px-2 py-1 text-[11px]"
                >
                  {lang === "en" ? "Download" : "ダウンロード"}
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {lang === "en" ? "No photos yet." : "写真はまだありません。"}
        </p>
      )}
    </div>
  );
}
