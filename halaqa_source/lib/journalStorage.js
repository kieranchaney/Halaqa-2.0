"use client";

const KEY = "halaqa.localJournal.v1";

// JOURNAL PRIVACY BOUNDARY:
// Journal entries are intentionally stored only in this browser/device.
// Do not add Supabase, API, analytics, sync, backup, or remote calls here.
// Server sync for journal data is an architectural violation for Halaqa.

export const journalTags = ["Reflection", "Goal", "Gratitude", "Dua", "Note"];

export function loadJournalEntries() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveJournalEntries(entries) {
  if (typeof window === "undefined") return;
  // This writes to localStorage only. It never transmits journal data anywhere.
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function exportJournalAsText(entries) {
  const content = entries
    .map((entry) => {
      return [
        entry.title || "Untitled",
        `Tag: ${entry.tag || "Note"}`,
        `Created: ${new Date(entry.createdAt).toLocaleString()}`,
        `Modified: ${new Date(entry.updatedAt).toLocaleString()}`,
        "",
        entry.body
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `halaqa-journal-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
