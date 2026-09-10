import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import type { SharedFileOut, UserBrief } from "../api/types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Tab = "with-me" | "by-me";

export default function FilesPage() {
  const [tab, setTab] = useState<Tab>("with-me");
  const [directory, setDirectory] = useState<UserBrief[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sharedWithMe, setSharedWithMe] = useState<SharedFileOut[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedFileOut[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [withMe, byMe] = await Promise.all([
      api.get<SharedFileOut[]>("/files/shared-with-me"),
      api.get<SharedFileOut[]>("/files/shared-by-me"),
    ]);
    setSharedWithMe(withMe.data);
    setSharedByMe(byMe.data);
  }

  useEffect(() => {
    api.get<UserBrief[]>("/users/directory").then((res) => setDirectory(res.data));
    refresh();
  }, []);

  async function handleUpload() {
    if (!file || !recipientId) return;
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/files/upload?recipient_id=${recipientId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      refresh();
    } catch {
      setError("Upload failed. Check the file size and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(f: SharedFileOut) {
    const res = await api.get(`/files/${f.id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = f.original_filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  const list = tab === "with-me" ? sharedWithMe : sharedByMe;
  const selected = list.find((f) => f.id === selectedId) ?? list[0] ?? null;

  return (
    <AppLayout>
      <div className="mb-4 rounded-2xl border bg-white p-5" style={{ borderColor: "var(--pn-border)" }}>
        <p className="mb-3 text-[15px] font-medium" style={{ color: "var(--pn-text)" }}>
          Share a file
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: "var(--pn-border)" }}
          >
            <option value="">Select recipient...</option>
            {directory.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={!file || !recipientId || isUploading}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--pn-accent)" }}
          >
            {isUploading ? "Uploading..." : "Upload & share"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div
        className="flex h-[calc(100vh-16rem)] overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: "var(--pn-border)" }}
      >
        <div className="w-72 shrink-0 overflow-y-auto border-r" style={{ borderColor: "var(--pn-border)" }}>
          <div className="flex border-b" style={{ borderColor: "var(--pn-border)" }}>
            <button
              onClick={() => setTab("with-me")}
              className="flex-1 py-3 text-[13px] font-medium"
              style={{
                color: tab === "with-me" ? "var(--pn-accent-strong)" : "var(--pn-text-muted)",
                borderBottom: tab === "with-me" ? "2px solid var(--pn-accent)" : "2px solid transparent",
              }}
            >
              Shared with me
            </button>
            <button
              onClick={() => setTab("by-me")}
              className="flex-1 py-3 text-[13px] font-medium"
              style={{
                color: tab === "by-me" ? "var(--pn-accent-strong)" : "var(--pn-text-muted)",
                borderBottom: tab === "by-me" ? "2px solid var(--pn-accent)" : "2px solid transparent",
              }}
            >
              Shared by me
            </button>
          </div>
          {list.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedId(f.id)}
              className="block w-full px-4 py-3 text-left"
              style={{
                background: selected?.id === f.id ? "var(--pn-bg-soft)" : "transparent",
                borderLeft: selected?.id === f.id ? "2px solid var(--pn-accent)" : "2px solid transparent",
              }}
            >
              <p className="truncate text-[13px] font-medium" style={{ color: "var(--pn-text)" }}>
                {f.original_filename}
              </p>
              <p className="text-xs" style={{ color: "var(--pn-text-muted)" }}>
                {formatSize(f.size_bytes)}
              </p>
            </button>
          ))}
          {list.length === 0 && (
            <p className="px-4 py-6 text-sm" style={{ color: "var(--pn-text-muted)" }}>
              Nothing here yet.
            </p>
          )}
        </div>

        <div className="flex-1 p-6">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--pn-text-muted)" }}>
              Select a file to see details
            </div>
          ) : (
            <div>
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--pn-accent-soft)" }}
              >
                <i className="ti ti-file text-[28px]" style={{ color: "var(--pn-accent-strong)" }} />
              </div>
              <p className="text-[17px] font-medium" style={{ color: "var(--pn-text)" }}>
                {selected.original_filename}
              </p>
              <p className="mb-6 text-sm" style={{ color: "var(--pn-text-muted)" }}>
                {formatSize(selected.size_bytes)} · {selected.content_type}
              </p>
              {tab === "with-me" && (
                <button
                  onClick={() => handleDownload(selected)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white"
                  style={{ background: "var(--pn-accent)" }}
                >
                  Download
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
