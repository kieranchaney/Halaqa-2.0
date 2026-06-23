"use client";

import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import { getUserGroups } from "../../lib/groups";
import { getMessages, sendMessage, subscribeToMessages, unsubscribe } from "../../lib/messages";

function ChatBody() {
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const activeGroup = groups.find((group) => group.id === activeGroupId);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    async function loadGroups() {
      setStatus("Loading groups...");
      try {
        const nextGroups = await getUserGroups(user.id);
        if (!active) return;
        setGroups(nextGroups);
        if (nextGroups.length === 1) setActiveGroupId(nextGroups[0].id);
        if (nextGroups.length > 1) setActiveGroupId((current) => current || nextGroups[0].id);
        setStatus("");
      } catch (error) {
        if (active) setStatus(error.message || "Unable to load groups.");
      }
    }

    loadGroups();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!activeGroupId) return;
    let active = true;

    async function loadGroupMessages() {
      setStatus("Loading messages...");
      try {
        const nextMessages = await getMessages(activeGroupId, 100);
        if (active) {
          setMessages(nextMessages);
          setStatus("");
        }
      } catch (error) {
        if (active) setStatus(error.message || "Unable to load messages.");
      }
    }

    loadGroupMessages();
    const subscription = subscribeToMessages(activeGroupId, async () => {
      const nextMessages = await getMessages(activeGroupId, 100);
      if (active) setMessages(nextMessages);
    });

    return () => {
      active = false;
      unsubscribe(subscription);
    };
  }, [activeGroupId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function submitMessage() {
    const body = draft.trim();
    if (!body || !activeGroupId || !user?.id || sending) return;

    const optimistic = {
      id: `optimistic-${Date.now()}`,
      group_id: activeGroupId,
      user_id: user.id,
      display_name: user.display_name,
      body,
      created_at: new Date().toISOString(),
      is_system: false
    };

    setSending(true);
    setDraft("");
    setMessages((items) => [...items, optimistic]);
    try {
      await sendMessage(activeGroupId, user.id, body);
    } catch (error) {
      setStatus(error.message || "Unable to send message.");
      setMessages((items) => items.filter((message) => message.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  function onComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  if (loading) {
    return <main className="halaqa-chat-shell"><p className="halaqa-chat-status">Loading Halaqa...</p></main>;
  }

  if (!user) {
    return <main className="halaqa-chat-shell"><p className="halaqa-chat-status">Please log in to open your halaqa chat.</p></main>;
  }

  return (
    <main className="halaqa-chat-shell">
      <header className="halaqa-chat-header">
        <div>
          <span>Halaqa chat</span>
          <h1>{activeGroup?.name || "Choose a group"}</h1>
        </div>
        {groups.length > 1 && (
          <select value={activeGroupId} onChange={(event) => setActiveGroupId(event.target.value)} aria-label="Choose group">
            {groups.map((group) => (
              <option value={group.id} key={group.id}>{group.name}</option>
            ))}
          </select>
        )}
      </header>

      {groups.length === 0 ? (
        <section className="halaqa-chat-empty">
          <p>You are not part of a halaqa group yet.</p>
        </section>
      ) : (
        <>
          {status && <p className="halaqa-chat-status">{status}</p>}
          <section className="halaqa-message-list" ref={listRef}>
            {messages.map((message) => {
              const mine = message.user_id === user.id;
              return (
                <article className={`halaqa-message-row ${mine ? "mine" : "theirs"}`} key={message.id}>
                  <div className="halaqa-message-bubble">
                    {!mine && !message.is_system && <strong>{message.display_name}</strong>}
                    <p>{message.body}</p>
                    <small>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                  </div>
                </article>
              );
            })}
          </section>
          <form
            className="halaqa-composer"
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage();
            }}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="Write to the group..."
              rows={1}
            />
            <button type="submit" disabled={sending || !draft.trim()}>
              {sending ? "Sending" : "Send"}
            </button>
          </form>
        </>
      )}

      <style jsx>{`
        .halaqa-chat-shell {
          min-height: 100vh;
          padding: max(18px, env(safe-area-inset-top)) 14px calc(92px + env(safe-area-inset-bottom));
          background: var(--paper);
          color: var(--ink);
        }

        .halaqa-chat-header {
          position: sticky;
          top: 0;
          z-index: 2;
          display: grid;
          gap: 12px;
          padding: 10px 0 14px;
          background: rgba(249, 246, 240, 0.96);
          backdrop-filter: blur(10px);
        }

        .halaqa-chat-header span {
          color: var(--gold);
          font-size: var(--caption);
          font-weight: 800;
          text-transform: uppercase;
        }

        .halaqa-chat-header h1 {
          margin: 4px 0 0;
          color: var(--green);
          font-family: "Libre Baskerville", Georgia, serif;
          font-size: var(--display);
        }

        .halaqa-chat-header select {
          min-height: 44px;
        }

        .halaqa-message-list {
          display: grid;
          align-content: start;
          gap: 10px;
          height: calc(100vh - 180px);
          overflow-y: auto;
          padding: 8px 0 18px;
        }

        .halaqa-message-row {
          display: flex;
        }

        .halaqa-message-row.mine {
          justify-content: flex-end;
        }

        .halaqa-message-row.theirs {
          justify-content: flex-start;
        }

        .halaqa-message-bubble {
          max-width: min(78%, 520px);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 12px;
          background: var(--white);
          box-shadow: 0 6px 16px rgba(27, 67, 50, 0.06);
        }

        .halaqa-message-row.mine .halaqa-message-bubble {
          border-color: var(--green);
          background: var(--green);
          color: white;
        }

        .halaqa-message-bubble strong {
          display: block;
          margin-bottom: 4px;
          color: var(--green);
          font-size: var(--caption);
        }

        .halaqa-message-bubble p {
          margin: 0;
          line-height: 1.45;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .halaqa-message-bubble small {
          display: block;
          margin-top: 6px;
          color: var(--muted);
          font-size: 0.72rem;
          text-align: right;
        }

        .halaqa-message-row.mine small {
          color: rgba(255, 255, 255, 0.75);
        }

        .halaqa-composer {
          position: fixed;
          left: 50%;
          bottom: 0;
          width: min(100%, 960px);
          transform: translateX(-50%);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          padding: 10px 14px max(14px, env(safe-area-inset-bottom));
          border-top: 1px solid var(--line);
          background: rgba(249, 246, 240, 0.97);
          backdrop-filter: blur(12px);
        }

        .halaqa-composer textarea {
          min-height: 44px;
          max-height: 120px;
          resize: none;
        }

        .halaqa-composer button {
          border: 0;
          border-radius: 8px;
          background: var(--green);
          color: white;
          font-weight: 800;
          padding: 0 16px;
        }

        .halaqa-composer button:disabled {
          opacity: 0.55;
        }

        .halaqa-chat-status,
        .halaqa-chat-empty {
          color: var(--muted);
          text-align: center;
          padding: 28px 12px;
        }

        @media (min-width: 760px) {
          .halaqa-chat-shell {
            max-width: 960px;
            margin: 0 auto;
            padding-inline: 24px;
          }

          .halaqa-chat-header {
            grid-template-columns: minmax(0, 1fr) 260px;
            align-items: end;
          }
        }
      `}</style>
    </main>
  );
}

export default function HalaqaClient() {
  return (
    <AuthProvider>
      <ChatBody />
    </AuthProvider>
  );
}

