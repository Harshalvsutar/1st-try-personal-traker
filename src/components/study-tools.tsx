import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StudyReportModal } from "@/components/study-report-modal";
import { todayKey, useTracker, emptyColorDay, type ColorKey } from "@/lib/tracker-store";

function pastDays(count: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    out.push(todayKey(d));
    d.setDate(d.getDate() - 1);
  }
  return out;
}

const fmt = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function DateChart() {
  const { data } = useTracker();
  const [count, setCount] = useState(30);
  const days = pastDays(count);
  return (
    <div className="space-y-2">
      {days.map((k) => {
        const r = data.records[k];
        const done = r?.topics.filter((t) => t.done).length ?? 0;
        return (
          <div key={k} className="rounded-lg bg-secondary px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground">{fmt(k)}</span>
              <span className="text-muted-foreground">
                {r?.sessions ?? 0} focus · {done}/{r?.topics.length ?? 0} topics ·{" "}
                {r?.questions ?? 0} Qs
              </span>
            </div>
          </div>
        );
      })}
      <Button variant="outline" className="w-full" onClick={() => setCount((c) => c + 60)}>
        Show older days
      </Button>
    </div>
  );
}

const COLORS: { key: ColorKey; cls: string; label: string }[] = [
  { key: "r", cls: "bg-mark-red", label: "Red" },
  { key: "g", cls: "bg-mark-green", label: "Green" },
  { key: "b", cls: "bg-mark-blue", label: "Blue" },
  { key: "y", cls: "bg-mark-yellow", label: "Yellow" },
];

export function ColorTracker() {
  const { data, updateColorDay } = useTracker();
  const [count, setCount] = useState(30);
  const [open, setOpen] = useState<string | null>(null);
  const days = pastDays(count);
  return (
    <div className="space-y-2">
      {days.map((k) => {
        const d = data.colorDays[k] ?? emptyColorDay();
        return (
          <div key={k} className="rounded-lg bg-secondary px-3 py-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex-1 text-left text-sm text-foreground"
                onClick={() => setOpen(open === k ? null : k)}
              >
                {fmt(k)}
              </button>
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-label={`${c.label} ${d[c.key] ? "on" : "off"}`}
                  onClick={() => updateColorDay(k, (x) => ({ ...x, [c.key]: !x[c.key] }))}
                  className={`size-6 rounded-md border border-border transition-colors ${d[c.key] ? c.cls : "bg-background"}`}
                />
              ))}
            </div>
            {open === k && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Note for this day"
                  value={d.note}
                  maxLength={3000}
                  onChange={(e) => updateColorDay(k, (x) => ({ ...x, note: e.target.value }))}
                />
                {d.checks.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      checked={c.done}
                      onCheckedChange={(v) =>
                        updateColorDay(k, (x) => {
                          const checks = [...x.checks] as typeof x.checks;
                          checks[i] = { label: checks[i]!.label, done: v === true };
                          return { ...x, checks };
                        })
                      }
                    />
                    <Input
                      placeholder={`Item ${i + 1}`}
                      value={c.label}
                      maxLength={100}
                      onChange={(e) =>
                        updateColorDay(k, (x) => {
                          const checks = [...x.checks] as typeof x.checks;
                          checks[i] = { done: checks[i]!.done, label: e.target.value };
                          return { ...x, checks };
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <Button variant="outline" className="w-full" onClick={() => setCount((c) => c + 60)}>
        Show older days
      </Button>
    </div>
  );
}

export function ReminderSettings() {
  const { data, setReminder } = useTracker();
  const perm = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  const [status, setStatus] = useState(perm);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Daily reminder</Label>
        <Switch
          checked={data.reminder.enabled}
          onCheckedChange={async (v) => {
            if (v && typeof Notification !== "undefined" && Notification.permission === "default") {
              setStatus(await Notification.requestPermission());
            }
            setReminder({ enabled: v, lastShown: v ? "" : data.reminder.lastShown });
          }}
        />
      </div>
      <div>
        <Label htmlFor="rtime">Time</Label>
        <Input
          id="rtime"
          type="time"
          className="mt-2"
          value={data.reminder.time}
          onChange={(e) => e.target.value && setReminder({ time: e.target.value, lastShown: "" })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {status === "granted"
          ? "Phone notifications are on."
          : "Notifications are blocked or unsupported — you'll see an in-app reminder instead."}{" "}
        Reminders show while the app is open or next time you open it that day.
      </p>
    </div>
  );
}

export function BackupPanel() {
  const { data, replaceAll, markBackup } = useTracker();
  const size = useMemo(() => Math.round(JSON.stringify(data).length / 1024), [data]);

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `focusgrove-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    markBackup();
    toast.success("Backup downloaded");
  };

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!confirm("Replace all current data with this backup?")) return;
      replaceAll(parsed);
      toast.success("Backup restored");
    } catch {
      toast.error("That file isn't a valid backup");
    }
  };

  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="space-y-3">
      <StudyReportModal open={reportOpen} onOpenChange={setReportOpen} />
      <p className="text-sm text-muted-foreground">
        Your data ({size} KB) is stored on this device. Export a backup regularly so you never lose
        it when changing phones. Last backup: {data.lastBackup || "never"}.
      </p>
      <Button
        className="w-full gap-2 bg-primary text-primary-foreground font-medium"
        onClick={() => setReportOpen(true)}
      >
        <FileText className="size-4" /> Export study & heatmap report (PDF)
      </Button>
      <Button variant="secondary" className="w-full gap-2" onClick={exportFile}>
        <Download className="size-4" /> Export data backup (.json)
      </Button>
      <Button variant="outline" className="w-full" asChild>
        <label>
          <Upload className="size-4" /> Import backup
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </Button>
    </div>
  );
}
