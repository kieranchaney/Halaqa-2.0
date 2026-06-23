"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "./../context/AuthContext";
import { approveRequest, createGroup, denyRequest, getJoinRequests, getUserGroups } from "./../lib/groups";
import { getCurrentLesson, isReflectionMode } from "./../lib/lessons";
import { getMessages, sendMessage, subscribeToMessages, unsubscribe } from "./../lib/messages";
import {
  getReflections,
  hasUserReflected,
  submitReflection,
  subscribeToReflections
} from "../lib/reflections";
import {
  exportJournalAsText,
  journalTags,
  loadJournalEntries,
  saveJournalEntries
} from "../lib/journalStorage";

function formatRemaining(ms) {
  if (ms <= 0) return "Open now";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button className={`button pressable ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

function EmptyState({ icon = "○", title, action }) {
  return (
    <div className="empty-state">
      <div aria-hidden="true">{icon}</div>
      <p>{title}</p>
      {action}
    </div>
  );
}

function SplashScreen() {
  return (
    <main className="splash-screen">
      <div className="app-mark" aria-hidden="true">H</div>
      <h1>Halaqa</h1>
      <p>Preparing your circle...</p>
    </main>
  );
}

function GroupDrawer({ open, groups, selectedGroupId, loading, onClose, onSelect, onCreate }) {
  return (
    <div className={`drawer-layer ${open ? "open" : ""}`} aria-hidden={!open}>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close menu" />
      <aside className="group-drawer">
        <Button className="create-group-button" onClick={onCreate}>Create New Group</Button>
        <div className="drawer-group-list">
          {loading ? (
            <EmptyState title="Loading your halaqas..." />
          ) : groups.length === 0 ? (
            <EmptyState title="You are not part of any halaqa yet. Create one or ask for an invite link." />
          ) : groups.map((group) => (
            <button
              className={`drawer-group-row pressable ${selectedGroupId === group.id ? "active" : ""}`}
              key={group.id}
              onClick={() => onSelect(group.id)}
            >
              <span>{group.name}</span>
              {group.unreadCount > 0 && <i>{group.unreadCount}</i>}
              <b aria-hidden="true" />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function CreateGroupModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("Private");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  return (
    <div className="modal-layer">
      <form
        className="modal-panel"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim()) return;
          setSubmitting(true);
          try {
            await onCreate({ name: name.trim(), description, is_public: visibility === "Public" });
            setName("");
            setDescription("");
            setVisibility("Private");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <h2>Create New Group</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" />
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          <option>Private</option>
          <option>Public</option>
        </select>
        <div className="compose-row">
          <Button disabled={submitting}>{submitting ? "Creating" : "Create group"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function lessonBodyParagraphs(lesson) {
  if (!lesson?.body_text) return [];
  if (Array.isArray(lesson.body_text)) return lesson.body_text;
  return String(lesson.body_text)
    .split(/\n{2,}|<\/p>/)
    .map((paragraph) => paragraph.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}

function LessonCard({ lesson }) {
  const [expanded, setExpanded] = useState(false);
  const prompts = lesson?.reflection_prompts || [];

  if (!lesson) {
    return (
      <article className="lesson-card">
        <div className="lesson-preview">
          <div>
            <div className="lesson-topline">
              <span>Weekly lesson</span>
              <span>Not assigned</span>
            </div>
            <h2>No lesson has been released for this group yet.</h2>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`lesson-card ${expanded ? "expanded" : "collapsed"}`}>
      <div className="lesson-preview">
        <div>
          <div className="lesson-topline">
            <span>{lesson.theme}</span>
            <span>This week</span>
          </div>
          <h2>{lesson.title}</h2>
        </div>
        <button className="lesson-toggle pressable" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      {expanded && (
        <div className="lesson-scroll-shell">
          <div className="lesson-scroll-content">
            <section className="source-block">
              <p className="arabic" dir="rtl" lang="ar">{lesson.ayat}</p>
              <p className="transliteration">{lesson.ayat_transliteration}</p>
              <p>{lesson.ayat_translation}</p>
              <strong>{lesson.ayat_reference}</strong>
            </section>
            <section className="source-block hadith">
              <p>{lesson.hadith}</p>
              <strong>{lesson.hadith_reference}</strong>
            </section>
            <div className="lesson-body">
              {lessonBodyParagraphs(lesson).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <div className="prompt-callout">
              <span>{prompts.length === 1 ? "Reflection prompt" : "Reflection prompts"}</span>
              {prompts.map((prompt, index) => (
                <p className="prompt-line" key={prompt}>
                  <strong>{index + 1}.</strong> {prompt}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function ReflectionThread({ user, groupId, lesson, reflections, onSubmit, hasSubmitted, remainingMs, loadingOlder, onRefresh }) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  return (
    <section className="conversation reflection">
      <div className="mode-banner">
        <div>
          <span>Reflection Mode</span>
          <strong>{formatRemaining(remainingMs)} until Open Chat</strong>
        </div>
      </div>
      <div className="prompt-pin">
        {(lesson.reflection_prompts || []).map((prompt, index) => (
          <p key={prompt}><strong>Prompt {index + 1}:</strong> {prompt}</p>
        ))}
      </div>
      <button className="load-older pressable" onClick={onRefresh} disabled={loadingOlder}>
        {loadingOlder ? "Loading reflections..." : "Refresh reflections"}
      </button>
      {reflections.length === 0 && <EmptyState icon="✦" title="No reflections yet. Be the first to share." />}
      {reflections.map((reflection) => (
        <article className="reflection-item" key={`${groupId}-${reflection.id}`}>
          <div>
            <strong>{reflection.display_name}</strong>
            {reflection.user_id === user.id && <span>Your reflection</span>}
          </div>
          <p>{reflection.body}</p>
        </article>
      ))}
      {notice && <p className="inline-status">{notice}</p>}
      {!hasSubmitted ? (
        <form
          className="reflection-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            const result = await onSubmit(draft.trim());
            if (result?.duplicate) setNotice("You've already shared your reflection this week.");
            setDraft("");
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share one honest reflection..."
          />
          <Button>Share reflection</Button>
        </form>
      ) : (
        <p className="inline-status">You've already shared your reflection this week.</p>
      )}
    </section>
  );
}

function OpenChat({ user, groupId, messages, onSend, loadingOlder, onLoadOlder }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const body = draft.trim().slice(0, 1000);
    if (!body || sending) return;
    setSending(true);
    onSend({
      id: `optimistic-${Date.now()}`,
      group_id: groupId,
      user_id: user.id,
      display_name: user.display_name,
      body,
      created_at: new Date().toISOString(),
      is_system: false,
      optimistic: true
    });
    setDraft("");
    try {
      await sendMessage(groupId, user.id, body);
    } finally {
      setTimeout(() => setSending(false), 1000);
    }
  }

  return (
    <section className="conversation chat">
      <div className="discussion-divider"><span>Open Discussion</span></div>
      <button className="load-older pressable" onClick={onLoadOlder} disabled={loadingOlder}>
        {loadingOlder ? "Loading older messages..." : "Load older messages"}
      </button>
      <div className="message-list">
        {messages.length === 0 && <EmptyState icon="◇" title="No messages yet. Start the discussion when chat opens." />}
        {messages.map((message) => (
          message.is_system ? (
            <p className="system-note" key={message.id}>{message.body}</p>
          ) : (
            <article className="message" key={message.id}>
              <div className="avatar">{message.display_name?.slice(0, 1) || "M"}</div>
              <div>
                <header>
                  <strong>{message.display_name}</strong>
                  <span>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </header>
                <p>{message.body}</p>
              </div>
            </article>
          )
        ))}
      </div>
      <form className="message-composer" onSubmit={submit}>
        <input value={draft} maxLength={1000} onChange={(event) => setDraft(event.target.value)} placeholder="Write to the group..." />
        <Button disabled={sending}>{sending ? "Sending" : "Send"}</Button>
      </form>
    </section>
  );
}

function AdminPanel({ group }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const canManage = group?.role === "admin" || group?.role === "co-admin";

  useEffect(() => {
    if (!canManage || !group?.id) return;
    setLoading(true);
    getJoinRequests(group.id)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [canManage, group?.id]);

  if (!canManage) return null;

  async function decide(requestId, approved) {
    if (approved) await approveRequest(requestId);
    else await denyRequest(requestId);
    setRequests((items) => items.filter((item) => item.id !== requestId));
  }

  return (
    <aside className="admin-panel">
      <header>
        <span>{group.role === "admin" ? "Admin panel" : "Co-admin panel"}</span>
        <strong>{loading ? "Loading requests" : `${requests.length} pending requests`}</strong>
      </header>
      <div className="admin-actions">
        {requests.length === 0 ? (
          <Button variant="ghost" disabled>No pending requests</Button>
        ) : requests.map((request) => (
          <div className="compose-row" key={request.id}>
            <Button variant="ghost" onClick={() => decide(request.id, true)}>
              Approve {request.users?.display_name || "member"}
            </Button>
            <Button variant="ghost" onClick={() => decide(request.id, false)}>Deny</Button>
          </div>
        ))}
      </div>
    </aside>
  );
}

function HalaqaTab({ user, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [reflections, setReflections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [toast, setToast] = useState("");
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const reflectionMode = lesson ? isReflectionMode(lesson.reflection_unlocked_at) : false;

  async function loadGroups() {
    setLoading(true);
    try {
      const nextGroups = await getUserGroups(user.id);
      setGroups(nextGroups);
      setSelectedGroupId((current) => current || nextGroups[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, [user.id]);

  useEffect(() => {
    if (!drawerOpen) return;
    loadGroups();
  }, [drawerOpen]);

  useEffect(() => {
    if (!selectedGroupId) return;
    let active = true;
    setLesson(null);
    setReflections([]);
    setMessages([]);

    async function loadLesson() {
      const currentLesson = await getCurrentLesson(selectedGroupId);
      if (!active) return;
      setLesson(currentLesson);
      if (!currentLesson) return;

      setRemainingMs(new Date(currentLesson.reflection_unlocked_at).getTime() - Date.now());
      const [nextReflections, reflected, nextMessages] = await Promise.all([
        getReflections(currentLesson.groupLessonId),
        hasUserReflected(currentLesson.groupLessonId, user.id),
        getMessages(selectedGroupId, 100)
      ]);
      if (!active) return;
      setReflections(nextReflections);
      setHasSubmitted(reflected);
      setMessages(nextMessages);
    }

    loadLesson().catch((error) => setToast(error.message || "Unable to load this halaqa."));
    return () => {
      active = false;
    };
  }, [selectedGroupId, user.id]);

  useEffect(() => {
    if (!lesson?.reflection_unlocked_at) return;
    const timer = setInterval(() => {
      setRemainingMs(new Date(lesson.reflection_unlocked_at).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [lesson?.reflection_unlocked_at]);

  useEffect(() => {
    if (!lesson?.groupLessonId) return;
    const subscription = subscribeToReflections(lesson.groupLessonId, async () => {
      setReflections(await getReflections(lesson.groupLessonId));
      setHasSubmitted(await hasUserReflected(lesson.groupLessonId, user.id));
    });
    return () => {
      unsubscribe(subscription);
    };
  }, [lesson?.groupLessonId, user.id]);

  useEffect(() => {
    if (!selectedGroupId) return;
    const subscription = subscribeToMessages(selectedGroupId, async () => {
      setMessages(await getMessages(selectedGroupId, 100));
    });
    return () => {
      unsubscribe(subscription);
    };
  }, [selectedGroupId]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  return (
    <main className="app-screen safe-screen">
      <GroupDrawer
        open={drawerOpen}
        groups={groups}
        loading={loading}
        selectedGroupId={selectedGroupId}
        onClose={() => setDrawerOpen(false)}
        onCreate={() => {
          setDrawerOpen(false);
          setCreateOpen(true);
        }}
        onSelect={(groupId) => {
          setSelectedGroupId(groupId);
          setDrawerOpen(false);
        }}
      />
      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (group) => {
          const created = await createGroup(group.name, group.description, group.is_public, user.id);
          await loadGroups();
          setSelectedGroupId(created.id);
          setCreateOpen(false);
          showToast("Group created.");
        }}
      />
      {toast && <div className="toast">{toast}</div>}
      <header className="topbar app-header">
        <button className="hamburger pressable" onClick={() => setDrawerOpen(true)} aria-label="Open group menu">
          <span /><span /><span />
        </button>
        <div>
          <span>Assalamu Alaikum, {user.display_name}</span>
          <h1>{selectedGroup?.name || "Halaqa"}</h1>
        </div>
        <button className="settings-button pressable" onClick={onLogout} aria-label="Log out">Log Out</button>
      </header>
      {!selectedGroup ? (
        <EmptyState
          icon="◎"
          title={loading ? "Loading your halaqas..." : "You are not part of any halaqa yet. Create one or ask for an invite link."}
          action={!loading && <Button onClick={() => setCreateOpen(true)}>Create New Group</Button>}
        />
      ) : (
        <>
          <section className="group-summary">
            <span>{selectedGroup.memberCount} members</span>
            <span>{selectedGroup.is_public ? "Public" : "Private"}</span>
            <span>{selectedGroup.role}</span>
          </section>
          <AdminPanel group={selectedGroup} />
          <LessonCard lesson={lesson} />
          {!lesson ? (
            <EmptyState title="This group is ready. A weekly lesson will appear here once it is assigned." />
          ) : reflectionMode ? (
            <ReflectionThread
              user={user}
              groupId={selectedGroup.id}
              lesson={lesson}
              reflections={reflections}
              hasSubmitted={hasSubmitted}
              remainingMs={remainingMs}
              loadingOlder={loadingOlder}
              onRefresh={async () => {
                setLoadingOlder(true);
                setReflections(await getReflections(lesson.groupLessonId));
                setLoadingOlder(false);
              }}
              onSubmit={async (body) => {
                const result = await submitReflection(lesson.groupLessonId, selectedGroup.id, user.id, body);
                if (result.reflection) {
                  setReflections((items) => [...items, result.reflection]);
                  setHasSubmitted(true);
                  showToast("Reflection shared.");
                }
                return result;
              }}
            />
          ) : (
            <OpenChat
              user={user}
              groupId={selectedGroup.id}
              messages={messages}
              loadingOlder={loadingOlder}
              onLoadOlder={async () => {
                setLoadingOlder(true);
                const cursor = messages[0]?.created_at;
                const older = await getMessages(selectedGroup.id, 50, cursor);
                setMessages((items) => [...older, ...items]);
                setLoadingOlder(false);
              }}
              onSend={(message) => {
                setMessages((items) => [...items, message]);
              }}
            />
          )}
        </>
      )}
    </main>
  );
}

function JournalTab() {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ title: "", body: "", tag: "Reflection" });
  const [saving, setSaving] = useState(false);

  useEffect(() => setEntries(loadJournalEntries()), []);
  useEffect(() => saveJournalEntries(entries), [entries]);

  const filteredEntries = useMemo(() => {
    const term = query.toLowerCase();
    return entries
      .filter((entry) => `${entry.title} ${entry.body} ${entry.tag}`.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [entries, query]);

  function resetComposer() {
    setEditing(null);
    setDraft({ title: "", body: "", tag: "Reflection" });
  }

  function saveEntry(event) {
    event.preventDefault();
    if (!draft.body.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    if (editing) {
      setEntries((items) => items.map((item) => item.id === editing ? { ...item, ...draft, updatedAt: now } : item));
    } else {
      setEntries((items) => [{ id: `entry-${Date.now()}`, ...draft, createdAt: now, updatedAt: now }, ...items]);
    }
    setTimeout(() => setSaving(false), 180);
    resetComposer();
  }

  return (
    <main className="app-screen journal-screen safe-screen">
      <header className="topbar">
        <div>
          <span>Private journal</span>
          <h1>Reflection space</h1>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            if (window.confirm("Your journal will be saved to your device as a file. It will not be uploaded anywhere.")) {
              exportJournalAsText(entries);
            }
          }}
        >
          Export
        </Button>
      </header>
      <p className="privacy-note">Your journal is saved only on this device and is never shared or uploaded.</p>
      <form className="journal-compose keyboard-safe" onSubmit={saveEntry}>
        <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title (optional)" />
        <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Write freely..." />
        <div className="compose-row">
          <select value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })}>
            {journalTags.map((tag) => <option key={tag}>{tag}</option>)}
          </select>
          <Button disabled={saving}>{saving ? "Saving" : editing ? "Save changes" : "Save entry"}</Button>
          {editing && <Button type="button" variant="ghost" onClick={resetComposer}>Cancel</Button>}
        </div>
      </form>
      <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search journal" />
      <section className="entry-list">
        {filteredEntries.length === 0 && <EmptyState icon="□" title="No journal entries yet." />}
        {filteredEntries.map((entry) => (
          <article className="entry-card" key={entry.id}>
            <button
              className="pressable"
              onClick={() => {
                setEditing(entry.id);
                setDraft({ title: entry.title, body: entry.body, tag: entry.tag });
              }}
            >
              <span>{entry.tag}</span>
              <strong>{entry.title || `${entry.body.slice(0, 60)}${entry.body.length > 60 ? "..." : ""}`}</strong>
              <small>{new Date(entry.updatedAt).toLocaleDateString()}</small>
            </button>
            <button className="delete pressable" onClick={() => setEntries((items) => items.filter((item) => item.id !== entry.id))}>
              Delete
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

function HomeContent() {
  const { user, session, loading, signOut } = useAuth();
  const [tab, setTab] = useState("halaqa");

  async function logout() {
    await signOut();
    window.location.replace("/login");
  }

  if (loading || !session || !user) return <SplashScreen />;

  return (
    <div className="phone-shell">
      {tab === "halaqa" ? <HalaqaTab user={user} onLogout={logout} /> : <JournalTab />}
      <nav className="bottom-tabs safe-bottom">
        <button className={`pressable ${tab === "halaqa" ? "active" : ""}`} onClick={() => setTab("halaqa")}>
          <span>Halaqa</span>
        </button>
        <button className={`pressable ${tab === "journal" ? "active" : ""}`} onClick={() => setTab("journal")}>
          <span>Journal</span>
        </button>
      </nav>
    </div>
  );
}

export default function HomeClient() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
