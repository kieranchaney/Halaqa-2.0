"use client";

import { useEffect, useMemo, useState } from "react";
import {
  currentUser,
  groups as seedGroups,
  initialMessages,
  initialReflections,
  lesson
} from "../lib/mockData";
import {
  exportJournalAsText,
  journalTags,
  loadJournalEntries,
  saveJournalEntries
} from "../lib/journalStorage";

const SESSION_KEY = "halaqa.auth.session";
const GROUPS_KEY = "halaqa.groups.v1";
const TERMS_URL = "https://halaqa.app/terms"; // TODO: LAUNCH BLOCKER - publish Terms of Service page before store submission.
const PRIVACY_URL = "https://halaqa.app/privacy"; // TODO: LAUNCH BLOCKER - publish Privacy Policy page before store submission.
const unlockAt = new Date(Date.now() + 1000 * 60 * 60 * 6 + 1000 * 60 * 14);

// TODO: LAUNCH BLOCKER - replace this local session shim with Supabase Auth getSession/signUp/signIn/signOut in the Expo app.
// TODO: LAUNCH BLOCKER - configure Supabase client with AsyncStorage: auth.storage, autoRefreshToken, persistSession, detectSessionInUrl false.
// TODO: LAUNCH BLOCKER - connect password reset deep links end to end.
// TODO: LAUNCH BLOCKER - build account deletion flow that removes auth user data, memberships, messages, and handles admin transfer/deletion.
// TODO: LAUNCH BLOCKER - build first-time onboarding for users with no groups.
// TODO: LAUNCH BLOCKER - capture App Store and Play Store screenshots after final native polish.

function formatRemaining(ms) {
  if (ms <= 0) return "Open now";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function messagesKey(groupId) {
  return `messages_groupid_${groupId}`;
}

function reflectionsKey(groupId) {
  return `reflections_groupid_${groupId}_current`;
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

function LandingScreen({ onMode }) {
  return (
    <main className="auth-shell">
      <section className="auth-panel landing-panel">
        <div className="app-mark" aria-hidden="true">H</div>
        <h1>Halaqa</h1>
        <p>Weekly lessons, sincere reflection, and a private journal for steady growth.</p>
        <div className="auth-grid">
          <Button onClick={() => onMode("signup")}>Sign Up</Button>
          <Button variant="ghost" onClick={() => onMode("login")}>Log In</Button>
        </div>
      </section>
    </main>
  );
}

function AuthFieldError({ children }) {
  return children ? <p className="field-error">{children}</p> : null;
}

function SignUpScreen({ onBack, onAuthed }) {
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.displayName.trim()) nextErrors.displayName = "Display name is required.";
    if (!form.email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const session = { ...currentUser, display_name: form.displayName.trim(), email: form.email.trim() };
    writeJson(SESSION_KEY, session);
    onAuthed(session);
  }

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <button className="text-link back-link pressable" type="button" onClick={onBack}>Back</button>
        <p className="eyebrow">Create account</p>
        <h1>Join your halaqa.</h1>
        <input value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} placeholder="Display name" />
        <AuthFieldError>{errors.displayName}</AuthFieldError>
        <input value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="Email address" />
        <AuthFieldError>{errors.email}</AuthFieldError>
        <div className="password-row">
          <input value={form.password} onChange={(event) => setField("password", event.target.value)} type={showPassword ? "text" : "password"} placeholder="Password" />
          <button className="pressable" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
        </div>
        <AuthFieldError>{errors.password}</AuthFieldError>
        <input value={form.confirm} onChange={(event) => setField("confirm", event.target.value)} type={showPassword ? "text" : "password"} placeholder="Confirm password" />
        <AuthFieldError>{errors.confirm}</AuthFieldError>
        <Button>Create Account</Button>
        <p className="auth-legal">
          By signing up you agree to our <a href={TERMS_URL}>Terms of Service</a> and <a href={PRIVACY_URL}>Privacy Policy</a>.
        </p>
      </form>
    </main>
  );
}

function LogInScreen({ onBack, onAuthed }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!form.email.includes("@") || !form.password) {
      setError("Enter your email and password.");
      return;
    }
    const session = { ...currentUser, email: form.email.trim() };
    writeJson(SESSION_KEY, session);
    onAuthed(session);
  }

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <button className="text-link back-link pressable" type="button" onClick={onBack}>Back</button>
        <p className="eyebrow">Welcome back</p>
        <h1>Log in.</h1>
        <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" />
        <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" placeholder="Password" />
        {error && <p className="field-error">{error}</p>}
        {notice && <p className="inline-status">{notice}</p>}
        <button className="text-link pressable" type="button" onClick={() => setNotice("Password reset email sent if this account exists.")}>
          Forgot password?
        </button>
        <Button>Log In</Button>
      </form>
    </main>
  );
}

function GroupDrawer({ open, groups, selectedGroupId, onClose, onSelect, onCreate }) {
  return (
    <div className={`drawer-layer ${open ? "open" : ""}`} aria-hidden={!open}>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close menu" />
      <aside className="group-drawer">
        <Button className="create-group-button" onClick={onCreate}>Create New Group</Button>
        <div className="drawer-group-list">
          {groups.length === 0 ? (
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

  if (!open) return null;

  return (
    <div className="modal-layer">
      <form
        className="modal-panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onCreate({ name: name.trim(), description, is_public: visibility === "Public" });
          setName("");
          setDescription("");
          setVisibility("Private");
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
          <Button>Create group</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function LessonCard() {
  const [expanded, setExpanded] = useState(false);
  const prompts = lesson.reflection_prompts || [];

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
              <p className="arabic" dir="rtl" lang="ar">{lesson.ayatArabic}</p>
              <p className="transliteration">{lesson.ayatTransliteration}</p>
              <p>{lesson.ayatEnglish}</p>
              <strong>{lesson.ayat_reference}</strong>
            </section>
            <section className="source-block hadith">
              <p>{lesson.hadith}</p>
              <strong>{lesson.hadith_reference}</strong>
            </section>
            <div className="lesson-body">
              {lesson.body_text.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
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

function ReflectionThread({ groupId, reflections, onSubmit, hasSubmitted, remainingMs, loadingOlder, onLoadOlder }) {
  const [draft, setDraft] = useState("");

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
      <button className="load-older pressable" onClick={onLoadOlder} disabled={loadingOlder}>
        {loadingOlder ? "Loading reflections..." : "Load older reflections"}
      </button>
      <div className="system-note">
        Assalamu Alaikum and welcome to your halaqa. Your first lesson is ready above. Start by sharing your reflection on this week's prompt - there are no wrong answers, only honest ones.
      </div>
      {reflections.length === 0 && <EmptyState icon="✦" title="No reflections yet. Be the first to share." />}
      {reflections.map((reflection) => (
        <article className="reflection-item" key={`${groupId}-${reflection.id}`}>
          <div>
            <strong>{reflection.display_name}</strong>
            {reflection.user_id === currentUser.id && <span>Your reflection</span>}
          </div>
          <p>{reflection.body}</p>
        </article>
      ))}
      {!hasSubmitted ? (
        <form
          className="reflection-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            onSubmit(draft.trim());
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

function OpenChat({ messages, onSend, loadingOlder, onLoadOlder }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const body = draft.trim().slice(0, 1000);
    if (!body) return;
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 180));
    onSend(body);
    setDraft("");
    setSending(false);
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
              <div className="avatar">{message.display_name.slice(0, 1)}</div>
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

function AdminPanel({ role }) {
  if (role === "member") return null;
  return (
    <aside className="admin-panel">
      <header>
        <span>{role === "admin" ? "Admin panel" : "Co-admin panel"}</span>
        <strong>3 pending requests</strong>
      </header>
      <div className="admin-actions">
        <Button variant="ghost">Review requests</Button>
        <Button variant="ghost">Post custom lesson</Button>
        {role === "admin" && <Button variant="ghost">Group settings</Button>}
      </div>
    </aside>
  );
}

function HalaqaTab({ user, onLogout }) {
  const [allGroups, setAllGroups] = useState(seedGroups.map((group, index) => ({ ...group, unreadCount: index === 0 ? 2 : 0 })));
  const [selectedGroupId, setSelectedGroupId] = useState(seedGroups[0]?.id || "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reflections, setReflections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [remainingMs, setRemainingMs] = useState(unlockAt.getTime() - Date.now());
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [toast, setToast] = useState("");
  const selectedGroup = allGroups.find((group) => group.id === selectedGroupId);
  const hasSubmitted = reflections.some((reflection) => reflection.user_id === currentUser.id);
  const isReflectionMode = remainingMs > 0;

  useEffect(() => {
    const stored = readJson(GROUPS_KEY, null);
    if (stored) {
      setAllGroups(stored);
      setSelectedGroupId(stored[0]?.id || "");
    }
  }, []);

  useEffect(() => {
    writeJson(GROUPS_KEY, allGroups);
  }, [allGroups]);

  useEffect(() => {
    const timer = setInterval(() => setRemainingMs(unlockAt.getTime() - Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    setMessages(readJson(messagesKey(selectedGroupId), []));
    setReflections(readJson(reflectionsKey(selectedGroupId), []));
    const refresh = setTimeout(() => {
      const mergedMessages = readJson(messagesKey(selectedGroupId), initialMessages).slice(-100);
      const mergedReflections = readJson(reflectionsKey(selectedGroupId), initialReflections).slice(-100);
      setMessages(mergedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
      setReflections(mergedReflections.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
      writeJson(messagesKey(selectedGroupId), mergedMessages);
      writeJson(reflectionsKey(selectedGroupId), mergedReflections);
    }, 250);
    const realtime = setInterval(() => {}, 30000);
    return () => {
      clearTimeout(refresh);
      clearInterval(realtime);
    };
  }, [selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) writeJson(messagesKey(selectedGroupId), messages);
  }, [messages, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) writeJson(reflectionsKey(selectedGroupId), reflections);
  }, [reflections, selectedGroupId]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  function loadOlder(kind) {
    setLoadingOlder(true);
    setTimeout(() => {
      const older = {
        id: `${kind}-older-${Date.now()}`,
        user_id: "user-older",
        display_name: "Older member",
        body: kind === "message" ? "An earlier cached message from this halaqa." : "An earlier reflection from this cycle.",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        is_system: false
      };
      if (kind === "message") setMessages((items) => [older, ...items]);
      if (kind === "reflection") setReflections((items) => [older, ...items]);
      setLoadingOlder(false);
    }, 500);
  }

  return (
    <main className="app-screen safe-screen">
      <GroupDrawer
        open={drawerOpen}
        groups={allGroups}
        selectedGroupId={selectedGroupId}
        onClose={() => setDrawerOpen(false)}
        onCreate={() => {
          setDrawerOpen(false);
          setCreateOpen(true);
        }}
        onSelect={(groupId) => {
          setSelectedGroupId(groupId);
          setAllGroups((items) => items.map((group) => group.id === groupId ? { ...group, unreadCount: 0 } : group));
          setDrawerOpen(false);
        }}
      />
      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(group) => {
          const created = {
            id: `group-${Date.now()}`,
            name: group.name,
            description: group.description,
            role: "admin",
            memberCount: 1,
            is_public: group.is_public,
            invite_code: crypto.randomUUID?.() || `${Date.now()}`,
            unreadCount: 0
          };
          setAllGroups((items) => [created, ...items]);
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
          title="You are not part of any halaqa yet. Create one or ask for an invite link."
          action={<Button onClick={() => setCreateOpen(true)}>Create New Group</Button>}
        />
      ) : (
        <>
          <section className="group-summary">
            <span>{selectedGroup.memberCount} members</span>
            <span>{selectedGroup.is_public ? "Public" : "Private"}</span>
            <span>{selectedGroup.role}</span>
          </section>
          <AdminPanel role={selectedGroup.role} />
          <LessonCard />
          {isReflectionMode ? (
            <ReflectionThread
              groupId={selectedGroup.id}
              reflections={reflections}
              hasSubmitted={hasSubmitted}
              remainingMs={remainingMs}
              loadingOlder={loadingOlder}
              onLoadOlder={() => loadOlder("reflection")}
              onSubmit={(body) => {
                setReflections((items) => [
                  ...items,
                  {
                    id: `reflection-${Date.now()}`,
                    user_id: currentUser.id,
                    display_name: currentUser.display_name,
                    body,
                    created_at: new Date().toISOString()
                  }
                ]);
                showToast("Reflection shared.");
              }}
            />
          ) : (
            <OpenChat
              messages={messages}
              loadingOlder={loadingOlder}
              onLoadOlder={() => loadOlder("message")}
              onSend={(body) => {
                setMessages((items) => [
                  ...items,
                  {
                    id: `message-${Date.now()}`,
                    user_id: currentUser.id,
                    display_name: currentUser.display_name,
                    body,
                    created_at: new Date().toISOString(),
                    is_system: false
                  }
                ]);
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

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState("landing");
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("halaqa");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSession(readJson(SESSION_KEY, null));
      setBooting(false);
    }, 260);
    return () => clearTimeout(timer);
  }, []);

  function logout() {
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setAuthMode("landing");
  }

  if (booting) return <SplashScreen />;
  if (!session && authMode === "landing") return <LandingScreen onMode={setAuthMode} />;
  if (!session && authMode === "signup") return <SignUpScreen onBack={() => setAuthMode("landing")} onAuthed={setSession} />;
  if (!session && authMode === "login") return <LogInScreen onBack={() => setAuthMode("landing")} onAuthed={setSession} />;

  return (
    <div className="phone-shell">
      {tab === "halaqa" ? <HalaqaTab user={session} onLogout={logout} /> : <JournalTab />}
      <nav className="bottom-tabs safe-bottom">
        <button className={`pressable ${tab === "halaqa" ? "active" : ""}`} onClick={() => setTab("halaqa")}>
          <span>Halaqa</span>
          <i>2</i>
        </button>
        <button className={`pressable ${tab === "journal" ? "active" : ""}`} onClick={() => setTab("journal")}>
          <span>Journal</span>
        </button>
      </nav>
    </div>
  );
}
