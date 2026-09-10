import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import type { FeedbackCommentOut, FeedbackPostOut } from "../api/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function PostCard({ post, onChanged }: { post: FeedbackPostOut; onChanged: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedbackCommentOut[]>([]);
  const [draft, setDraft] = useState("");

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next) {
      const { data } = await api.get<FeedbackCommentOut[]>(
        `/feedback/${post.id}/comments`
      );
      setComments(data);
    }
  }

  async function handleLike() {
    await api.post(`/feedback/${post.id}/like`);
    onChanged();
  }

  async function handleComment() {
    if (!draft.trim()) return;
    await api.post(`/feedback/${post.id}/comments`, { body: draft.trim() });
    setDraft("");
    const { data } = await api.get<FeedbackCommentOut[]>(`/feedback/${post.id}/comments`);
    setComments(data);
    onChanged();
  }

  return (
    <div className="flex gap-3 border-b px-5 py-4" style={{ borderColor: "var(--pn-border)" }}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--pn-bg-soft)" }}
      >
        <i className="ti ti-user text-[16px]" style={{ color: "#9db3af" }} />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-medium" style={{ color: "var(--pn-text)" }}>
            Anonymous
          </span>
          <span className="text-xs" style={{ color: "#a3aeab" }}>
            · {timeAgo(post.created_at)}
          </span>
        </div>
        <p className="my-1 text-[14px] leading-relaxed" style={{ color: "#1a2523" }}>
          {post.body}
        </p>
        <div className="flex gap-5 text-xs" style={{ color: "#9db3af" }}>
          <button
            onClick={handleLike}
            className="flex items-center gap-1"
            style={post.liked_by_me ? { color: "var(--pn-accent-strong)" } : undefined}
          >
            <i className={`ti ${post.liked_by_me ? "ti-heart-filled" : "ti-heart"} text-[15px]`} />
            {post.like_count}
          </button>
          <button onClick={toggleComments} className="flex items-center gap-1">
            <i className="ti ti-message-circle text-[15px]" />
            {post.comment_count}
          </button>
        </div>

        {showComments && (
          <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "var(--pn-border)" }}>
            {comments.map((c) => (
              <div key={c.id} className="text-[13px]" style={{ color: "#1a2523" }}>
                <span className="font-medium" style={{ color: "var(--pn-text)" }}>
                  Anonymous
                </span>{" "}
                {c.body}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Reply anonymously..."
                className="flex-1 rounded-full border px-3 py-1.5 text-xs outline-none"
                style={{ borderColor: "var(--pn-border)" }}
              />
              <button
                onClick={handleComment}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--pn-accent)" }}
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [posts, setPosts] = useState<FeedbackPostOut[]>([]);
  const [draft, setDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  async function refresh() {
    const { data } = await api.get<FeedbackPostOut[]>("/feedback");
    setPosts(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handlePost() {
    if (!draft.trim()) return;
    setIsPosting(true);
    try {
      await api.post("/feedback", { body: draft.trim() });
      setDraft("");
      refresh();
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <AppLayout>
      <div
        className="mx-auto max-w-xl overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: "var(--pn-border)" }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--pn-border)" }}>
          <p className="text-[15px] font-medium" style={{ color: "var(--pn-text)" }}>
            Feedback board
          </p>
          <p className="text-xs" style={{ color: "var(--pn-text-muted)" }}>
            Posts are always anonymous
          </p>
        </div>

        <div className="flex gap-3 border-b px-5 py-4" style={{ borderColor: "var(--pn-border)" }}>
          <div
            className="h-9 w-9 shrink-0 rounded-full"
            style={{ background: "var(--pn-accent-soft)" }}
          />
          <div className="flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share something anonymously..."
              rows={2}
              className="w-full resize-none border-none text-sm outline-none"
              style={{ color: "var(--pn-text)" }}
            />
            <div className="mt-1 flex justify-end">
              <button
                onClick={handlePost}
                disabled={!draft.trim() || isPosting}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "var(--pn-accent)" }}
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>

        {posts.map((p) => (
          <PostCard key={p.id} post={p} onChanged={refresh} />
        ))}
        {posts.length === 0 && (
          <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--pn-text-muted)" }}>
            No posts yet.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
