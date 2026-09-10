import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppLayout } from "../components/AppLayout";
import type { ConversationSummary, MessageOut, UserBrief } from "../api/types";

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [directory, setDirectory] = useState<UserBrief[]>([]);
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [draft, setDraft] = useState("");

  const activeUserId = searchParams.get("with");

  async function refreshConversations() {
    const { data } = await api.get<ConversationSummary[]>("/messages/conversations");
    setConversations(data);
  }

  useEffect(() => {
    refreshConversations();
    api.get<UserBrief[]>("/users/directory").then((res) => setDirectory(res.data));
  }, []);

  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      return;
    }
    api
      .get<MessageOut[]>(`/messages/with/${activeUserId}`)
      .then((res) => setMessages(res.data));
  }, [activeUserId]);

  async function handleSend() {
    if (!draft.trim() || !activeUserId) return;
    await api.post("/messages", { recipient_id: activeUserId, body: draft.trim() });
    setDraft("");
    const { data } = await api.get<MessageOut[]>(`/messages/with/${activeUserId}`);
    setMessages(data);
    refreshConversations();
  }

  const knownIds = new Set(conversations.map((c) => c.user_id));
  const newContacts = directory.filter((d) => !knownIds.has(d.id));
  const activePerson =
    conversations.find((c) => c.user_id === activeUserId) ||
    directory.find((d) => d.id === activeUserId);

  return (
    <AppLayout>
      <div
        className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: "var(--pn-border)" }}
      >
        <div
          className="w-64 shrink-0 overflow-y-auto border-r"
          style={{ borderColor: "var(--pn-border)" }}
        >
          <div className="px-4 py-4">
            <p className="text-[15px] font-medium" style={{ color: "var(--pn-text)" }}>
              Conversations
            </p>
          </div>
          {conversations.map((c) => (
            <button
              key={c.user_id}
              onClick={() => setSearchParams({ with: c.user_id })}
              className="block w-full px-4 py-3 text-left"
              style={{
                borderLeft:
                  activeUserId === c.user_id
                    ? "2px solid var(--pn-accent)"
                    : "2px solid transparent",
                background: activeUserId === c.user_id ? "var(--pn-bg-soft)" : "transparent",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: "var(--pn-text)" }}>
                  {c.full_name}
                </span>
                {c.unread_count > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                    style={{ background: "var(--pn-accent)" }}
                  >
                    {c.unread_count}
                  </span>
                )}
              </div>
              <p className="truncate text-xs" style={{ color: "var(--pn-text-muted)" }}>
                {c.last_message}
              </p>
            </button>
          ))}

          {newContacts.length > 0 && (
            <>
              <div
                className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide"
                style={{ color: "var(--pn-text-muted)" }}
              >
                Start a new conversation
              </div>
              {newContacts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSearchParams({ with: d.id })}
                  className="block w-full px-4 py-2 text-left text-sm"
                  style={{ color: "var(--pn-text)" }}
                >
                  {d.full_name}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          {!activeUserId ? (
            <div
              className="flex flex-1 items-center justify-center text-sm"
              style={{ color: "var(--pn-text-muted)" }}
            >
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              <div
                className="border-b px-5 py-4 text-[15px] font-medium"
                style={{ borderColor: "var(--pn-border)", color: "var(--pn-text)" }}
              >
                {activePerson && "full_name" in activePerson
                  ? activePerson.full_name
                  : "Conversation"}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="max-w-md rounded-2xl px-3 py-2 text-sm"
                    style={
                      m.sender_id === user?.id
                        ? { marginLeft: "auto", background: "var(--pn-accent)", color: "#fff" }
                        : { background: "var(--pn-bg-soft)", color: "var(--pn-text)" }
                    }
                  >
                    {m.body}
                  </div>
                ))}
              </div>
              <div
                className="flex gap-2 border-t p-3"
                style={{ borderColor: "var(--pn-border)" }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--pn-border)" }}
                />
                <button
                  onClick={handleSend}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white"
                  style={{ background: "var(--pn-accent)" }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
