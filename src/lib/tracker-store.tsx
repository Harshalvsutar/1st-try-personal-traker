import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";

export type Topic = { id: string; text: string; done: boolean };

export type DayRecord = {
  sessions: number;
  focusMinutes: number;
  questions: number;
  topics: Topic[];
};

export const PERSONAL_CATEGORIES = ["Movie", "Series", "Book", "Note", "Other"] as const;
export type PersonalCategory = (typeof PERSONAL_CATEGORIES)[number];

export type PersonalEntry = {
  id: string;
  title: string;
  category: PersonalCategory;
  date: string;
  rating: number;
  note: string;
};

export type ColorKey = "r" | "g" | "b" | "y";
export type ColorDay = {
  r: boolean;
  g: boolean;
  b: boolean;
  y: boolean;
  note: string;
  checks: [{ label: string; done: boolean }, { label: string; done: boolean }];
};

export type Reminder = { enabled: boolean; time: string; lastShown: string };

export type TrackerData = {
  version: number;
  records: Record<string, DayRecord>;
  timerMinutes: number;
  personal: PersonalEntry[];
  colorDays: Record<string, ColorDay>;
  reminder: Reminder;
  lastBackup: string;
};

const STORAGE_KEY = "focusgrove.data.v1";
const BACKUP_KEY = "focusgrove.data.prev";
export const DATA_VERSION = 2;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const num = (max: number) =>
  z.coerce
    .number()
    .catch(0)
    .transform((n) => Math.min(max, Math.max(0, Math.floor(n) || 0)));
const str = (max: number) =>
  z
    .string()
    .catch("")
    .transform((s) => s.slice(0, max));

const topicSchema = z.object({ id: z.string(), text: str(300), done: z.boolean().catch(false) });
const daySchema = z.object({
  sessions: num(1000),
  focusMinutes: num(100000),
  questions: num(100000),
  topics: z.array(z.unknown()).catch([]),
});
const entrySchema = z.object({
  id: z.string(),
  title: str(300),
  category: z.enum(PERSONAL_CATEGORIES).catch("Other"),
  date: z.string().regex(DATE_RE),
  rating: num(5),
  note: str(3000),
});
const checkSchema = z
  .object({ label: str(100), done: z.boolean().catch(false) })
  .catch({ label: "", done: false });
const colorSchema = z.object({
  r: z.boolean().catch(false),
  g: z.boolean().catch(false),
  b: z.boolean().catch(false),
  y: z.boolean().catch(false),
  note: str(3000)
    .optional()
    .transform((s) => s ?? ""),
  checks: z.array(checkSchema).catch([]),
});

export const emptyColorDay = (): ColorDay => ({
  r: false,
  g: false,
  b: false,
  y: false,
  note: "",
  checks: [
    { label: "", done: false },
    { label: "", done: false },
  ],
});

const emptyDay = (): DayRecord => ({ sessions: 0, focusMinutes: 0, questions: 0, topics: [] });

export const initialData: TrackerData = {
  version: DATA_VERSION,
  records: {},
  timerMinutes: 25,
  personal: [],
  colorDays: {},
  reminder: { enabled: false, time: "20:00", lastShown: "" },
  lastBackup: "",
};

/** Validate + migrate any stored/imported blob. Broken items are skipped, never thrown. */
export function sanitizeData(input: unknown): TrackerData {
  const raw = (input && typeof input === "object" ? input : {}) as {
    [K in keyof TrackerData]?: unknown;
  };
  const out: TrackerData = structuredClone(initialData);

  const tm = Number(raw.timerMinutes);
  out.timerMinutes = Number.isFinite(tm) && tm >= 1 && tm <= 180 ? Math.round(tm) : 25;

  if (raw.records && typeof raw.records === "object") {
    for (const [k, v] of Object.entries(raw.records as Record<string, unknown>)) {
      if (!DATE_RE.test(k)) continue;
      const d = daySchema.safeParse(v);
      if (!d.success) continue;
      const topics: Topic[] = [];
      for (const t of d.data.topics) {
        const p = topicSchema.safeParse(t);
        if (p.success) topics.push(p.data);
      }
      out.records[k] = { ...d.data, topics };
    }
  }

  if (Array.isArray(raw.personal)) {
    for (const e of raw.personal) {
      const p = entrySchema.safeParse(e);
      if (p.success && p.data.title) out.personal.push(p.data);
    }
  }

  if (raw.colorDays && typeof raw.colorDays === "object") {
    for (const [k, v] of Object.entries(raw.colorDays as Record<string, unknown>)) {
      if (!DATE_RE.test(k)) continue;
      const p = colorSchema.safeParse(v);
      if (!p.success) continue;
      const base = emptyColorDay();
      out.colorDays[k] = {
        ...p.data,
        checks: [p.data.checks[0] ?? base.checks[0], p.data.checks[1] ?? base.checks[1]],
      };
    }
  }

  const r = raw.reminder as Partial<Reminder> | undefined;
  if (r && typeof r === "object") {
    out.reminder = {
      enabled: r.enabled === true,
      time: typeof r.time === "string" && /^\d{2}:\d{2}$/.test(r.time) ? r.time : "20:00",
      lastShown: typeof r.lastShown === "string" ? r.lastShown : "",
    };
  }
  if (typeof raw.lastBackup === "string") out.lastBackup = raw.lastBackup;
  return out;
}

export function todayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Ctx = {
  ready: boolean;
  saveError: boolean;
  data: TrackerData;
  today: DayRecord;
  dayScore: (key: string) => number;
  setTimerMinutes: (m: number) => void;
  logSession: (minutes: number) => void;
  saveDailyRecord: (input: { topics: Topic[]; questions: number }) => void;
  updateTodayTopics: (topics: Topic[]) => void;
  upsertEntry: (e: PersonalEntry) => void;
  deleteEntry: (id: string) => void;
  updateColorDay: (key: string, fn: (d: ColorDay) => ColorDay) => void;
  setReminder: (r: Partial<Reminder>) => void;
  replaceAll: (d: TrackerData) => void;
  markBackup: () => void;
};

// Keep a single context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __focusgroveCtx?: React.Context<Ctx | null> };
const TrackerContext = (g.__focusgroveCtx ??= createContext<Ctx | null>(null));

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrackerData>(initialData);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(BACKUP_KEY);
      if (raw) setData(sanitizeData(JSON.parse(raw)));
    } catch {
      try {
        const prev = localStorage.getItem(BACKUP_KEY);
        if (prev) setData(sanitizeData(JSON.parse(prev)));
      } catch {
        /* start fresh */
      }
    }
    void navigator.storage?.persist?.().catch(() => {});
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const json = JSON.stringify(data);
      const current = localStorage.getItem(STORAGE_KEY);
      if (current && current !== json) localStorage.setItem(BACKUP_KEY, current);
      localStorage.setItem(STORAGE_KEY, json);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [data, ready]);

  const mutateToday = useCallback((fn: (day: DayRecord) => DayRecord) => {
    const key = todayKey();
    setData((prev) => ({
      ...prev,
      records: { ...prev.records, [key]: fn(prev.records[key] ?? emptyDay()) },
    }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const today = data.records[todayKey()] ?? emptyDay();
    return {
      ready,
      saveError,
      data,
      today,
      dayScore: (key) => {
        const r = data.records[key];
        if (!r) return 0;
        return r.sessions + r.topics.filter((t) => t.done).length + Math.floor(r.questions / 5);
      },
      setTimerMinutes: (m) => setData((prev) => ({ ...prev, timerMinutes: m })),
      logSession: (minutes) =>
        mutateToday((d) => ({
          ...d,
          sessions: d.sessions + 1,
          focusMinutes: d.focusMinutes + minutes,
        })),
      updateTodayTopics: (topics) => mutateToday((d) => ({ ...d, topics })),
      saveDailyRecord: ({ topics, questions }) => mutateToday((d) => ({ ...d, topics, questions })),
      upsertEntry: (e) =>
        setData((prev) => {
          const exists = prev.personal.some((x) => x.id === e.id);
          return {
            ...prev,
            personal: exists
              ? prev.personal.map((x) => (x.id === e.id ? e : x))
              : [e, ...prev.personal],
          };
        }),
      deleteEntry: (id) =>
        setData((prev) => ({ ...prev, personal: prev.personal.filter((x) => x.id !== id) })),
      updateColorDay: (key, fn) =>
        setData((prev) => ({
          ...prev,
          colorDays: { ...prev.colorDays, [key]: fn(prev.colorDays[key] ?? emptyColorDay()) },
        })),
      setReminder: (r) => setData((prev) => ({ ...prev, reminder: { ...prev.reminder, ...r } })),
      replaceAll: (d) => setData(sanitizeData(d)),
      markBackup: () => setData((prev) => ({ ...prev, lastBackup: todayKey() })),
    };
  }, [data, ready, saveError, mutateToday]);

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used inside TrackerProvider");
  return ctx;
}
