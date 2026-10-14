import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";

import { AppShell, ScreenTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { StudyReportModal } from "@/components/study-report-modal";
import { todayKey, useTracker } from "@/lib/tracker-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Work Grid | FocusGrove" },
      {
        name: "description",
        content:
          "A contribution-style heatmap of your focus sessions, study topics and questions solved.",
      },
      { property: "og:title", content: "Work Grid | FocusGrove" },
      {
        property: "og:description",
        content: "See every productive day at a glance in a colour-coded grid.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, dayScore } = useTracker();
  const [selected, setSelected] = useState(todayKey());
  const [reportOpen, setReportOpen] = useState(false);
  const day = data.records[selected];

  const all = Object.values(data.records);
  const totals = {
    sessions: all.reduce((a, r) => a + r.sessions, 0),
    questions: all.reduce((a, r) => a + r.questions, 0),
    topics: all.reduce((a, r) => a + r.topics.filter((t) => t.done).length, 0),
    activeDays: Object.keys(data.records).filter((k) => dayScore(k) > 0).length,
  };

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-2">
        <ScreenTitle title="Work grid" subtitle="Brighter squares mean a heavier day." />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="gap-1.5 text-xs font-medium"
        >
          <FileText className="size-3.5 text-primary" /> Export PDF
        </Button>
      </div>

      <StudyReportModal open={reportOpen} onOpenChange={setReportOpen} />

      <div className="rounded-xl border border-border bg-card p-4">
        <ContributionHeatmap dayScore={dayScore} onSelect={setSelected} selected={selected} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">{selected}</p>
        {day ? (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              Focus sessions: <span className="text-primary">{day.sessions}</span> (
              {day.focusMinutes} min)
            </li>
            <li>
              Questions solved: <span className="text-primary">{day.questions}</span>
            </li>
            <li>
              Topics done:{" "}
              <span className="text-primary">
                {day.topics.filter((t) => t.done).length}/{day.topics.length}
              </span>
            </li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Nothing logged on this day.</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Total sessions" value={totals.sessions} />
        <Stat label="Active days" value={totals.activeDays} />
        <Stat label="Questions solved" value={totals.questions} />
        <Stat label="Topics completed" value={totals.topics} />
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}
