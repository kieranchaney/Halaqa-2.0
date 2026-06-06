"use client";

import { useMemo, useRef, useState } from "react";

const ownerAccount = {
  email: "owner@halaqa.app",
  password: "studio-owner",
  role: "owner"
};

const initialLessons = [
  {
    id: "lesson-1",
    title: "Gratitude That Deepens the Heart",
    theme: "Gratitude",
    ayatReference: "Surah Al-Baqarah 2:152",
    ayatArabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    ayatTransliteration: "Fadhkuroonee adhkurkum washkuroo lee wa la takfuroon.",
    ayatEnglish: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
    hadithReference: "Sahih Muslim",
    hadith: "The believer responds to ease with gratitude and hardship with patience.",
    bodyText: "<p>Gratitude is a practice of seeing blessings clearly and returning them to Allah through worship, humility, and service.</p><p>This lesson invites the group to name specific gifts and choose one concrete act of shukr this week.</p>",
    reflectionPrompts: [
      "What is one blessing you often overlook, and how can you honor it this week?"
    ],
    status: "published",
    deliveredCount: 12,
    createdAt: "2026-05-01T12:00:00Z"
  },
  {
    id: "lesson-2",
    title: "The Weight of Intention",
    theme: "Niyyah",
    ayatReference: "Surah Al-Bayyinah 98:5",
    ayatArabic: "CONTENT REVIEW REQUIRED",
    ayatTransliteration: "CONTENT REVIEW REQUIRED",
    ayatEnglish: "CONTENT REVIEW REQUIRED",
    hadithReference: "Sahih Bukhari 1",
    hadith: "Actions are judged by intentions.",
    bodyText: "<p>Intention gives direction to the smallest action.</p><p>This lesson helps members renew ordinary routines as acts of worship.</p>",
    reflectionPrompts: ["What ordinary act could you renew with intention this week?"],
    status: "draft",
    deliveredCount: 0,
    createdAt: "2026-05-12T12:00:00Z"
  }
];

const emptyLesson = {
  title: "",
  theme: "",
  ayatReference: "",
  ayatArabic: "",
  ayatTransliteration: "",
  ayatEnglish: "",
  hadithReference: "",
  hadith: "",
  bodyText: "",
  reflectionPrompts: [""],
  status: "published"
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function bodyParagraphCount(html) {
  const text = html
    .replace(/<p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return text.length;
}

function StudioButton({ children, variant = "primary", ...props }) {
  return (
    <button className={`studio-button ${variant}`} {...props}>
      {children}
    </button>
  );
}

function StudioLogin({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const locked = lockedUntil && lockedUntil > Date.now();

  function submit(event) {
    event.preventDefault();
    if (locked) return;
    if (email === ownerAccount.email && password === ownerAccount.password && ownerAccount.role === "owner") {
      setFailed(0);
      onAuth();
      return;
    }
    const nextFailed = failed + 1;
    setFailed(nextFailed);
    if (nextFailed >= 5) {
      setLockedUntil(Date.now() + 15 * 60 * 1000);
    }
  }

  return (
    <main className="studio-login">
      <form className="studio-login-panel" onSubmit={submit}>
        <p className="studio-kicker">Halaqa Studio</p>
        <h1>Owner sign in</h1>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        <StudioButton disabled={locked}>{locked ? "Locked" : "Sign in"}</StudioButton>
        {(failed > 0 || locked) && (
          <p className="studio-error">
            Unable to sign in with those credentials. {locked ? "Try again in 15 minutes." : ""}
          </p>
        )}
      </form>
    </main>
  );
}

function LessonPreview({ draft }) {
  const prompts = draft.reflectionPrompts.filter((prompt) => prompt.trim());
  return (
    <article className="studio-preview-card">
      <div className="lesson-topline">
        <span>{draft.theme || "Theme"}</span>
        <span>Preview</span>
      </div>
      <h2>{draft.title || "Lesson title"}</h2>
      <section className="source-block">
        <p className="arabic" dir="rtl" lang="ar">{draft.ayatArabic || "Arabic ayat"}</p>
        <p className="transliteration">{draft.ayatTransliteration || "Transliteration"}</p>
        <p>{draft.ayatEnglish || "English translation"}</p>
        <strong>{draft.ayatReference || "Ayat reference"}</strong>
      </section>
      <section className="source-block hadith">
        <p>{draft.hadith || "Hadith text"}</p>
        <strong>{draft.hadithReference || "Hadith reference"}</strong>
      </section>
      <div className="lesson-body" dangerouslySetInnerHTML={{ __html: draft.bodyText || "<p>Body text preview.</p>" }} />
      <div className="prompt-callout">
        <span>{prompts.length === 1 ? "Reflection prompt" : "Reflection prompts"}</span>
        {(prompts.length ? prompts : ["Reflection prompt"]).map((prompt, index) => (
          <p className="prompt-line" key={`${prompt}-${index}`}>
            <strong>{index + 1}.</strong> {prompt}
          </p>
        ))}
      </div>
    </article>
  );
}

function RichBodyEditor({ value, onChange }) {
  const editorRef = useRef(null);

  function command(name) {
    document.execCommand(name, false);
    onChange(editorRef.current?.innerHTML || "");
  }

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button type="button" onClick={() => command("bold")} aria-label="Bold">B</button>
        <button type="button" onClick={() => command("italic")} aria-label="Italic">I</button>
      </div>
      <div
        ref={editorRef}
        className="rich-surface"
        contentEditable
        role="textbox"
        aria-label="Body Text"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

function LessonForm({ lesson, onSave, onCancel }) {
  const [draft, setDraft] = useState(lesson || emptyLesson);
  const [attempted, setAttempted] = useState(false);

  const errors = useMemo(() => {
    const result = {};
    [
      ["title", "Title is required."],
      ["theme", "Theme is required."],
      ["ayatReference", "Ayat Reference is required."],
      ["ayatArabic", "Arabic Ayat is required."],
      ["ayatTransliteration", "Transliteration is required."],
      ["ayatEnglish", "English Translation is required."],
      ["hadithReference", "Hadith Reference is required."],
      ["hadith", "Hadith is required."]
    ].forEach(([key, message]) => {
      if (!draft[key]?.trim()) result[key] = message;
    });
    if (bodyParagraphCount(draft.bodyText) < 2) result.bodyText = "Body Text must contain at least 2 paragraphs.";
    if (!draft.reflectionPrompts.some((prompt) => prompt.trim())) result.reflectionPrompts = "At least one prompt is required.";
    return result;
  }, [draft]);

  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save(status) {
    setAttempted(true);
    if (status === "published" && Object.keys(errors).length) return;
    onSave({
      ...draft,
      id: draft.id || `lesson-${Date.now()}`,
      status,
      deliveredCount: draft.deliveredCount || 0,
      createdAt: draft.createdAt || new Date().toISOString()
    });
  }

  return (
    <section className="studio-editor">
      <form className="lesson-template" onSubmit={(event) => event.preventDefault()}>
        <label>Title<input value={draft.title} onChange={(event) => setField("title", event.target.value)} /></label>
        {attempted && errors.title && <p className="studio-error">{errors.title}</p>}
        <label>Theme<input value={draft.theme} onChange={(event) => setField("theme", event.target.value)} /></label>
        {attempted && errors.theme && <p className="studio-error">{errors.theme}</p>}
        <label>Ayat Reference<input value={draft.ayatReference} onChange={(event) => setField("ayatReference", event.target.value)} /></label>
        {attempted && errors.ayatReference && <p className="studio-error">{errors.ayatReference}</p>}
        <fieldset>
          <legend>Ayat</legend>
          <label>Arabic text<textarea dir="rtl" lang="ar" className="arabic-input" value={draft.ayatArabic} onChange={(event) => setField("ayatArabic", event.target.value)} /></label>
          <label>Transliteration<textarea value={draft.ayatTransliteration} onChange={(event) => setField("ayatTransliteration", event.target.value)} /></label>
          <label>English Translation<textarea value={draft.ayatEnglish} onChange={(event) => setField("ayatEnglish", event.target.value)} /></label>
        </fieldset>
        {attempted && (errors.ayatArabic || errors.ayatTransliteration || errors.ayatEnglish) && <p className="studio-error">All Ayat fields are required.</p>}
        <label>Hadith Reference<input value={draft.hadithReference} onChange={(event) => setField("hadithReference", event.target.value)} /></label>
        {attempted && errors.hadithReference && <p className="studio-error">{errors.hadithReference}</p>}
        <label>Hadith<textarea value={draft.hadith} onChange={(event) => setField("hadith", event.target.value)} /></label>
        {attempted && errors.hadith && <p className="studio-error">{errors.hadith}</p>}
        <label>Body Text<RichBodyEditor value={draft.bodyText} onChange={(value) => setField("bodyText", value)} /></label>
        {attempted && errors.bodyText && <p className="studio-error">{errors.bodyText}</p>}
        <fieldset>
          <legend>Reflection Prompts</legend>
          {draft.reflectionPrompts.map((prompt, index) => (
            <div className="prompt-input-row" key={index}>
              <label>{`Prompt ${index + 1}`}<input value={prompt} onChange={(event) => {
                const prompts = [...draft.reflectionPrompts];
                prompts[index] = event.target.value;
                setField("reflectionPrompts", prompts);
              }} /></label>
              {index > 0 && (
                <button type="button" aria-label={`Remove Prompt ${index + 1}`} onClick={() => setField("reflectionPrompts", draft.reflectionPrompts.filter((_, itemIndex) => itemIndex !== index))}>
                  x
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-prompt" onClick={() => setField("reflectionPrompts", [...draft.reflectionPrompts, ""])}>
            Add another prompt
          </button>
        </fieldset>
        {attempted && errors.reflectionPrompts && <p className="studio-error">{errors.reflectionPrompts}</p>}
        <div className="studio-form-actions">
          <StudioButton type="button" onClick={() => save("published")}>Save to Library</StudioButton>
          <StudioButton type="button" variant="secondary" onClick={() => save("draft")}>Save Draft</StudioButton>
          <StudioButton type="button" variant="ghost" onClick={onCancel}>Cancel</StudioButton>
        </div>
      </form>
      <aside className="studio-preview">
        <LessonPreview draft={draft} />
      </aside>
    </section>
  );
}

function LessonsLibrary({ lessons, setLessons }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const term = query.toLowerCase();
    return lessons
      .filter((lesson) => `${lesson.title} ${lesson.theme}`.toLowerCase().includes(term))
      .sort((a, b) => String(a[sort]).localeCompare(String(b[sort])));
  }, [lessons, query, sort]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  if (editing) {
    return (
      <LessonForm
        lesson={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={(saved) => {
          setLessons((items) => {
            const exists = items.some((item) => item.id === saved.id);
            return exists ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items];
          });
          setEditing(null);
        }}
      />
    );
  }

  return (
    <section className="studio-panel">
      <header className="studio-section-header">
        <div>
          <p className="studio-kicker">Lessons</p>
          <h1>Library</h1>
        </div>
        <StudioButton onClick={() => setEditing("new")}>Create lesson</StudioButton>
      </header>
      <div className="studio-table-tools">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or theme" />
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="title">Sort by title</option>
          <option value="theme">Sort by theme</option>
          <option value="createdAt">Sort by date created</option>
        </select>
      </div>
      <table className="studio-table">
        <thead>
          <tr><th>Lesson ID</th><th>Title</th><th>Theme</th><th>Date created</th><th>Delivered</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {visible.map((lesson) => (
            <tr key={lesson.id}>
              <td>{lesson.id}</td>
              <td>{lesson.title}<span className={`status-pill ${lesson.status}`}>{lesson.status}</span></td>
              <td>{lesson.theme}</td>
              <td>{new Date(lesson.createdAt).toLocaleDateString()}</td>
              <td>{lesson.deliveredCount}</td>
              <td className="row-actions">
                <button onClick={() => setEditing(lesson)}>Edit</button>
                <button onClick={() => setEditing({ ...lesson, id: "", title: `${lesson.title} copy`, createdAt: "" })}>Duplicate</button>
                <button onClick={() => {
                  if (window.confirm("Deletion cannot be undone. Any groups currently scheduled for this lesson will have it replaced at next assignment.")) {
                    setLessons((items) => items.filter((item) => item.id !== lesson.id));
                  }
                }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="pagination">
        <StudioButton variant="ghost" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</StudioButton>
        <span>Page {page} of {pageCount}</span>
        <StudioButton variant="ghost" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</StudioButton>
      </footer>
    </section>
  );
}

function Schedule({ lessons }) {
  const [scheduled, setScheduled] = useState([
    { id: "slot-1", lessonId: "lesson-1", scheduledFor: new Date(Date.now() + 4 * 86400000).toISOString(), timezone: "UTC", status: "scheduled" }
  ]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + 1 + index * 7);
    date.setHours(6, 0, 0, 0);
    return date;
  });

  return (
    <section className="studio-panel schedule-layout">
      <header className="studio-section-header">
        <div>
          <p className="studio-kicker">Schedule</p>
          <h1>Weekly slots</h1>
        </div>
      </header>
      <div className="week-grid">
        {weeks.map((week) => {
          const slot = scheduled.find((item) => new Date(item.scheduledFor).toDateString() === week.toDateString());
          const sent = slot?.status === "sent" || week < new Date(Date.now() - 86400000);
          const today = week.toDateString() === new Date().toDateString();
          return (
            <button className={cx("week-slot", sent && "sent", slot && !sent && "scheduled", !slot && !sent && "unassigned", today && "today")} key={week.toISOString()} onClick={() => setSelectedWeek({ week, slot })}>
              <strong>{week.toLocaleDateString()}</strong>
              <span>{slot ? lessons.find((lesson) => lesson.id === slot.lessonId)?.title || "Unknown lesson" : "Unassigned"}</span>
              <em>{slot?.status || "Unassigned"}</em>
            </button>
          );
        })}
      </div>
      {selectedWeek && (
        <ScheduleDrawer
          week={selectedWeek.week}
          slot={selectedWeek.slot}
          lessons={lessons}
          onClose={() => setSelectedWeek(null)}
          onDelete={(id) => {
            setScheduled((items) => items.filter((item) => item.id !== id));
            setSelectedWeek(null);
          }}
          onSave={(slot) => {
            setScheduled((items) => {
              const exists = items.some((item) => item.id === slot.id);
              return exists ? items.map((item) => item.id === slot.id ? slot : item) : [...items, slot];
            });
            setSelectedWeek(null);
          }}
        />
      )}
    </section>
  );
}

function ScheduleDrawer({ week, slot, lessons, onClose, onSave, onDelete }) {
  const [lessonId, setLessonId] = useState(slot?.lessonId || lessons[0]?.id || "");
  const [scheduledFor, setScheduledFor] = useState((slot?.scheduledFor || week.toISOString()).slice(0, 16));
  const [timezone, setTimezone] = useState(slot?.timezone || "UTC");
  const locked = slot && new Date(slot.scheduledFor).getTime() - Date.now() < 3600000;

  return (
    <aside className="schedule-drawer">
      <header>
        <h2>{week.toLocaleDateString()}</h2>
        <button onClick={onClose}>Close</button>
      </header>
      {locked && <p className="studio-warning">This lesson launches in less than 1 hour and can no longer be edited.</p>}
      <label>Lesson<select disabled={locked} value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
        {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
      </select></label>
      <label>Launch date and time<input disabled={locked} type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /></label>
      <label>Timezone<select disabled={locked} value={timezone} onChange={(event) => setTimezone(event.target.value)}>
        <option>UTC</option><option>America/Los_Angeles</option><option>America/New_York</option><option>Europe/London</option>
      </select></label>
      <div className="studio-form-actions">
        <StudioButton disabled={locked} onClick={() => onSave({ id: slot?.id || `slot-${Date.now()}`, lessonId, scheduledFor: new Date(scheduledFor).toISOString(), timezone, status: "scheduled" })}>Save schedule</StudioButton>
        {slot && <StudioButton disabled={locked} variant="ghost" onClick={() => onDelete(slot.id)}>Delete</StudioButton>}
      </div>
    </aside>
  );
}

function Settings({ lessons }) {
  const [cronEnabled, setCronEnabled] = useState(true);
  const [studioUsers, setStudioUsers] = useState([{ email: ownerAccount.email, role: "owner" }]);
  const [email, setEmail] = useState("");

  return (
    <section className="studio-panel settings-grid">
      <header className="studio-section-header">
        <div>
          <p className="studio-kicker">Settings</p>
          <h1>Studio controls</h1>
        </div>
      </header>
      <div className="settings-card">
        <h2>Studio users</h2>
        <div className="studio-table-tools">
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" />
          <StudioButton onClick={() => {
            if (email.trim()) setStudioUsers((items) => [...items, { email: email.trim(), role: "owner" }]);
            setEmail("");
          }}>Add owner</StudioButton>
        </div>
        {studioUsers.map((user) => (
          <div className="settings-row" key={user.email}>
            <span>{user.email}</span>
            <button onClick={() => setStudioUsers((items) => items.filter((item) => item.email !== user.email))}>Remove</button>
          </div>
        ))}
      </div>
      <div className="settings-card">
        <h2>Library count</h2>
        <strong>{lessons.length}</strong>
      </div>
      <div className="settings-card">
        <h2>Global cron job</h2>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={cronEnabled}
            onChange={(event) => {
              const next = event.target.checked;
              if (window.confirm("Disabling the cron means no groups will receive new lessons automatically.")) {
                setCronEnabled(next);
              }
            }}
          />
          {cronEnabled ? "Enabled" : "Disabled"}
        </label>
      </div>
    </section>
  );
}

export default function StudioPage() {
  const [authed, setAuthed] = useState(false);
  const [section, setSection] = useState("Lessons");
  const [lessons, setLessons] = useState(initialLessons);

  if (!authed) return <StudioLogin onAuth={() => setAuthed(true)} />;

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <h1>Halaqa Studio</h1>
        {["Lessons", "Schedule", "Settings"].map((item) => (
          <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>{item}</button>
        ))}
      </aside>
      <section className="studio-content">
        {section === "Lessons" && <LessonsLibrary lessons={lessons} setLessons={setLessons} />}
        {section === "Schedule" && <Schedule lessons={lessons.filter((lesson) => lesson.status === "published")} />}
        {section === "Settings" && <Settings lessons={lessons} />}
      </section>
    </main>
  );
}
