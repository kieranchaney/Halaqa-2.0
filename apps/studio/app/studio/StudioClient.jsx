"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import {
  deleteLesson,
  deleteSchedule,
  getLessons,
  getScheduledLessons,
  isStudioOwner,
  saveLesson,
  saveSchedule
} from "../../lib/studio";

const emptyLesson = {
  title: "",
  theme: "",
  ayat_reference: "",
  ayat: "",
  ayat_transliteration: "",
  ayat_translation: "",
  hadith_reference: "",
  hadith: "",
  body_text: "",
  reflection_prompts: [""],
  status: "published"
};

function bodyParagraphCount(text) {
  return String(text || "")
    .replace(/<p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function StudioButton({ children, variant = "primary", ...props }) {
  return (
    <button className={`studio-button ${variant}`} {...props}>
      {children}
    </button>
  );
}

function LessonPreview({ draft }) {
  const prompts = (draft.reflection_prompts || []).filter((prompt) => prompt.trim());
  return (
    <article className="studio-preview-card">
      <div className="lesson-topline">
        <span>{draft.theme || "Theme"}</span>
        <span>Preview</span>
      </div>
      <h2>{draft.title || "Lesson title"}</h2>
      <section className="source-block">
        <p className="arabic" dir="rtl" lang="ar">{draft.ayat || "Arabic ayat"}</p>
        <p className="transliteration">{draft.ayat_transliteration || "Transliteration"}</p>
        <p>{draft.ayat_translation || "English translation"}</p>
        <strong>{draft.ayat_reference || "Ayat reference"}</strong>
      </section>
      <section className="source-block hadith">
        <p>{draft.hadith || "Hadith text"}</p>
        <strong>{draft.hadith_reference || "Hadith reference"}</strong>
      </section>
      <div className="lesson-body">
        {String(draft.body_text || "Body text preview.")
          .split(/\n{2,}/)
          .map((paragraph) => <p key={paragraph}>{paragraph.replace(/<[^>]+>/g, "")}</p>)}
      </div>
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

function LessonForm({ lesson, onSave, onCancel }) {
  const [draft, setDraft] = useState(lesson || emptyLesson);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const result = {};
    [
      ["title", "Title is required."],
      ["theme", "Theme is required."],
      ["ayat_reference", "Ayat Reference is required."],
      ["ayat", "Arabic Ayat is required."],
      ["ayat_transliteration", "Transliteration is required."],
      ["ayat_translation", "English Translation is required."],
      ["hadith_reference", "Hadith Reference is required."],
      ["hadith", "Hadith is required."]
    ].forEach(([key, message]) => {
      if (!draft[key]?.trim()) result[key] = message;
    });
    if (bodyParagraphCount(draft.body_text) < 2) result.body_text = "Body Text must contain at least 2 paragraphs.";
    if (!draft.reflection_prompts.some((prompt) => prompt.trim())) result.reflection_prompts = "At least one prompt is required.";
    return result;
  }, [draft]);

  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(status) {
    setAttempted(true);
    if (status === "published" && Object.keys(errors).length) return;
    setSaving(true);
    try {
      const saved = await saveLesson({
        ...draft,
        status,
        reflection_prompts: draft.reflection_prompts.filter((prompt) => prompt.trim())
      });
      onSave(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="studio-editor">
      <form className="lesson-template" onSubmit={(event) => event.preventDefault()}>
        <label>Title<input value={draft.title} onChange={(event) => setField("title", event.target.value)} /></label>
        {attempted && errors.title && <p className="studio-error">{errors.title}</p>}
        <label>Theme<input value={draft.theme} onChange={(event) => setField("theme", event.target.value)} /></label>
        {attempted && errors.theme && <p className="studio-error">{errors.theme}</p>}
        <label>Ayat Reference<input value={draft.ayat_reference} onChange={(event) => setField("ayat_reference", event.target.value)} /></label>
        <fieldset>
          <legend>Ayat</legend>
          <label>Arabic text<textarea dir="rtl" lang="ar" className="arabic-input" value={draft.ayat} onChange={(event) => setField("ayat", event.target.value)} /></label>
          <label>Transliteration<textarea value={draft.ayat_transliteration} onChange={(event) => setField("ayat_transliteration", event.target.value)} /></label>
          <label>English Translation<textarea value={draft.ayat_translation} onChange={(event) => setField("ayat_translation", event.target.value)} /></label>
        </fieldset>
        <label>Hadith Reference<input value={draft.hadith_reference} onChange={(event) => setField("hadith_reference", event.target.value)} /></label>
        <label>Hadith<textarea value={draft.hadith} onChange={(event) => setField("hadith", event.target.value)} /></label>
        <label>Body Text<textarea value={draft.body_text} onChange={(event) => setField("body_text", event.target.value)} /></label>
        {attempted && errors.body_text && <p className="studio-error">{errors.body_text}</p>}
        <fieldset>
          <legend>Reflection Prompts</legend>
          {draft.reflection_prompts.map((prompt, index) => (
            <div className="prompt-input-row" key={index}>
              <label>{`Prompt ${index + 1}`}<input value={prompt} onChange={(event) => {
                const prompts = [...draft.reflection_prompts];
                prompts[index] = event.target.value;
                setField("reflection_prompts", prompts);
              }} /></label>
              {index > 0 && (
                <button type="button" aria-label={`Remove Prompt ${index + 1}`} onClick={() => setField("reflection_prompts", draft.reflection_prompts.filter((_, itemIndex) => itemIndex !== index))}>
                  x
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-prompt" onClick={() => setField("reflection_prompts", [...draft.reflection_prompts, ""])}>
            Add another prompt
          </button>
        </fieldset>
        {attempted && errors.reflection_prompts && <p className="studio-error">{errors.reflection_prompts}</p>}
        <div className="studio-form-actions">
          <StudioButton type="button" disabled={saving} onClick={() => submit("published")}>Save to Library</StudioButton>
          <StudioButton type="button" disabled={saving} variant="secondary" onClick={() => submit("draft")}>Save Draft</StudioButton>
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
  const [editing, setEditing] = useState(null);
  const visible = lessons.filter((lesson) => `${lesson.title} ${lesson.theme}`.toLowerCase().includes(query.toLowerCase()));

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
      </div>
      <table className="studio-table">
        <thead>
          <tr><th>Lesson ID</th><th>Title</th><th>Theme</th><th>Date created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {visible.map((lesson) => (
            <tr key={lesson.id}>
              <td>{lesson.id}</td>
              <td>{lesson.title}<span className={`status-pill ${lesson.status}`}>{lesson.status}</span></td>
              <td>{lesson.theme}</td>
              <td>{new Date(lesson.created_at).toLocaleDateString()}</td>
              <td className="row-actions">
                <button onClick={() => setEditing(lesson)}>Edit</button>
                <button onClick={() => setEditing({ ...lesson, id: "", title: `${lesson.title} copy` })}>Duplicate</button>
                <button onClick={async () => {
                  if (window.confirm("Deletion cannot be undone. Any groups currently scheduled for this lesson will have it replaced at next assignment.")) {
                    await deleteLesson(lesson.id);
                    setLessons((items) => items.filter((item) => item.id !== lesson.id));
                  }
                }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Schedule({ lessons, slots, setSlots }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [lessonId, setLessonId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  function openSlot(slot) {
    setSelectedSlot(slot || {});
    setLessonId(slot?.lesson_id || lessons[0]?.id || "");
    setScheduledFor((slot?.scheduled_for || new Date().toISOString()).slice(0, 16));
    setTimezone(slot?.timezone || "UTC");
  }

  async function save() {
    const saved = await saveSchedule({
      id: selectedSlot.id,
      lesson_id: lessonId,
      scheduled_for: new Date(scheduledFor).toISOString(),
      timezone,
      status: "scheduled"
    });
    setSlots((items) => selectedSlot.id ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]);
    setSelectedSlot(null);
  }

  return (
    <section className="studio-panel schedule-layout">
      <header className="studio-section-header">
        <div>
          <p className="studio-kicker">Schedule</p>
          <h1>Weekly slots</h1>
        </div>
        <StudioButton onClick={() => openSlot(null)}>Schedule lesson</StudioButton>
      </header>
      <div className="week-grid">
        {slots.map((slot) => (
          <button className="week-slot scheduled" key={slot.id} onClick={() => openSlot(slot)}>
            <strong>{new Date(slot.scheduled_for).toLocaleString()}</strong>
            <span>{slot.lessons?.title || lessons.find((lesson) => lesson.id === slot.lesson_id)?.title || "Unknown lesson"}</span>
            <em>{slot.status}</em>
          </button>
        ))}
        {slots.length === 0 && <EmptyStudio text="No scheduled lessons yet." />}
      </div>
      {selectedSlot && (
        <aside className="schedule-drawer">
          <header>
            <h2>Schedule lesson</h2>
            <button onClick={() => setSelectedSlot(null)}>Close</button>
          </header>
          <label>Lesson<select value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
            {lessons.filter((lesson) => lesson.status === "published").map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
          </select></label>
          <label>Launch date and time<input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /></label>
          <label>Timezone<select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
            <option>UTC</option><option>America/Los_Angeles</option><option>America/New_York</option><option>Europe/London</option>
          </select></label>
          <div className="studio-form-actions">
            <StudioButton onClick={save}>Save schedule</StudioButton>
            {selectedSlot.id && <StudioButton variant="ghost" onClick={async () => {
              await deleteSchedule(selectedSlot.id);
              setSlots((items) => items.filter((item) => item.id !== selectedSlot.id));
              setSelectedSlot(null);
            }}>Delete</StudioButton>}
          </div>
        </aside>
      )}
    </section>
  );
}

function EmptyStudio({ text }) {
  return <p className="privacy-note">{text}</p>;
}

function Settings({ lessons }) {
  return (
    <section className="studio-panel settings-grid">
      <header className="studio-section-header">
        <div>
          <p className="studio-kicker">Settings</p>
          <h1>Studio controls</h1>
        </div>
      </header>
      <div className="settings-card">
        <h2>Library count</h2>
        <strong>{lessons.length}</strong>
      </div>
    </section>
  );
}

function StudioContent() {
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState("Lessons");
  const [lessons, setLessons] = useState([]);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (loading || !user) return;
    async function loadStudio() {
      setChecking(true);
      const owner = await isStudioOwner(user.id);
      setAllowed(owner);
      if (owner) {
        const [nextLessons, nextSlots] = await Promise.all([getLessons(), getScheduledLessons()]);
        setLessons(nextLessons);
        setSlots(nextSlots);
      }
      setChecking(false);
    }
    loadStudio();
  }, [loading, user]);

  if (loading || checking) {
    return (
      <main className="studio-login">
        <div className="studio-login-panel">
          <p className="studio-kicker">Halaqa Studio</p>
          <h1>Checking access...</h1>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="studio-login">
        <div className="studio-login-panel">
          <p className="studio-kicker">Halaqa Studio</p>
          <h1>Owner access required</h1>
          <p className="studio-error">Ask an owner to mark your user as a Studio owner in Supabase.</p>
        </div>
      </main>
    );
  }

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
        {section === "Schedule" && <Schedule lessons={lessons} slots={slots} setSlots={setSlots} />}
        {section === "Settings" && <Settings lessons={lessons} />}
      </section>
    </main>
  );
}

export default function StudioClient() {
  return (
    <AuthProvider>
      <StudioContent />
    </AuthProvider>
  );
}
