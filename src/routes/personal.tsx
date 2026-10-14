import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { AppShell, ScreenTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PERSONAL_CATEGORIES,
  todayKey,
  useTracker,
  type PersonalCategory,
  type PersonalEntry,
} from "@/lib/tracker-store";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "Personal Log | FocusGrove" },
      {
        name: "description",
        content: "Log movies, series, books and notes with dates and ratings.",
      },
      { property: "og:title", content: "Personal Log | FocusGrove" },
      { property: "og:description", content: "Keep track of what you watched, read and noted." },
    ],
  }),
  component: PersonalScreen,
});

const blank = (): PersonalEntry => ({
  id: crypto.randomUUID(),
  title: "",
  category: "Movie",
  date: todayKey(),
  rating: 0,
  note: "",
});

function PersonalScreen() {
  const { data, upsertEntry, deleteEntry } = useTracker();
  const [filter, setFilter] = useState<PersonalCategory | "All">("All");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<PersonalEntry | null>(null);

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = data.personal
      .filter((e) => filter === "All" || e.category === filter)
      .filter((e) => !s || e.title.toLowerCase().includes(s) || e.note.toLowerCase().includes(s))
      .sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, PersonalEntry[]>();
    for (const e of list) {
      const m = e.date.slice(0, 7);
      map.set(m, [...(map.get(m) ?? []), e]);
    }
    return [...map.entries()];
  }, [data.personal, filter, q]);

  const save = () => {
    if (!form || !form.title.trim()) return;
    upsertEntry({ ...form, title: form.title.trim() });
    setForm(null);
  };

  return (
    <AppShell>
      <Link
        to="/study"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Study
      </Link>
      <div className="flex items-start justify-between">
        <ScreenTitle title="Personal log" subtitle="Movies, series, books and notes." />
        <Button size="icon" aria-label="Add entry" onClick={() => setForm(blank())}>
          <Plus className="size-4" />
        </Button>
      </div>

      {form && (
        <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4">
          <Input
            placeholder="Title"
            value={form.title}
            maxLength={300}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            {PERSONAL_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, category: c })}
                className={`rounded-full px-3 py-1 text-xs ${form.category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => e.target.value && setForm({ ...form, date: e.target.value })}
          />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} stars`}
                onClick={() => setForm({ ...form, rating: form.rating === n ? 0 : n })}
              >
                <Star
                  className={`size-6 ${n <= form.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Note (optional)"
            value={form.note}
            maxLength={3000}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={!form.title.trim()}>
              Save
            </Button>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {(["All", ...PERSONAL_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1 text-xs ${filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        )}
        {groups.map(([month, items]) => (
          <section key={month}>
            <h2 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              {new Date(`${month}-15T12:00:00`).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <ul className="space-y-2">
              {items.map((e) => (
                <li key={e.id} className="rounded-lg bg-secondary px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.category} · {e.date}
                        {e.rating ? ` · ${"★".repeat(e.rating)}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => setForm(e)}
                      className="text-muted-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => confirm("Delete this entry?") && deleteEntry(e.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {e.note && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                      {e.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
