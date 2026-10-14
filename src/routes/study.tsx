import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, MoreVertical, Plus, Save, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BackupPanel, ColorTracker, DateChart, ReminderSettings } from "@/components/study-tools";
import { StudyReportModal } from "@/components/study-report-modal";
import { toast } from "sonner";

import { AppShell, ScreenTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTracker, type Topic } from "@/lib/tracker-store";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Daily Study Log | FocusGrove" },
      {
        name: "description",
        content:
          "Tick off study topics and log how many questions you solved, saved on your device.",
      },
      { property: "og:title", content: "Daily Study Log | FocusGrove" },
      {
        property: "og:description",
        content: "A simple daily checklist and question counter for study progress.",
      },
    ],
  }),
  component: StudyScreen,
});

function StudyScreen() {
  const { ready, today, saveDailyRecord } = useTracker();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState("0");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!ready) return;
    setTopics(today.topics);
    setQuestions(String(today.questions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const addTopic = () => {
    const text = draft.trim();
    if (!text) return;
    setTopics((t) => [...t, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
  };

  const [panel, setPanel] = useState<null | "chart" | "color" | "reminder" | "backup">(null);
  const [reportOpen, setReportOpen] = useState(false);
  const titles = {
    chart: "Date chart",
    color: "Colour tracker",
    reminder: "Daily reminder",
    backup: "Backup",
  } as const;

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-2">
        <ScreenTitle title="Study log" subtitle="Today's topics and problem count." />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/personal">Personal log</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setReportOpen(true)}>
              <FileText className="mr-2 size-4 text-primary" />
              Export PDF report
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPanel("chart")}>Date chart</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPanel("color")}>Colour tracker</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPanel("reminder")}>
              Daily reminder
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPanel("backup")}>Backup</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <StudyReportModal open={reportOpen} onOpenChange={setReportOpen} />

      <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{panel ? titles[panel] : ""}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {panel === "chart" && <DateChart />}
            {panel === "color" && <ColorTracker />}
            {panel === "reminder" && <ReminderSettings />}
            {panel === "backup" && <BackupPanel />}
          </div>
        </SheetContent>
      </Sheet>

      <div className="rounded-xl border border-border bg-card p-4">
        <Label className="text-sm">Study topics</Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={draft}
            placeholder="e.g. Graph traversal"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTopic()}
          />
          <Button onClick={addTopic} aria-label="Add topic">
            <Plus className="size-4" />
          </Button>
        </div>

        <ul className="mt-4 space-y-2">
          {topics.length === 0 && (
            <li className="text-sm text-muted-foreground">No topics yet — add your first one.</li>
          )}
          {topics.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2">
              <Checkbox
                checked={t.done}
                onCheckedChange={(v) =>
                  setTopics((list) =>
                    list.map((x) => (x.id === t.id ? { ...x, done: v === true } : x)),
                  )
                }
              />
              <span
                className={`flex-1 text-sm ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {t.text}
              </span>
              <button
                type="button"
                aria-label="Remove topic"
                onClick={() => setTopics((list) => list.filter((x) => x.id !== t.id))}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <Label htmlFor="questions" className="text-sm">
          Number of questions solved
        </Label>
        <Input
          id="questions"
          className="mt-2"
          type="number"
          inputMode="numeric"
          min={0}
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
        />
      </div>

      <Button
        className="mt-5 w-full"
        size="lg"
        onClick={() => {
          saveDailyRecord({ topics, questions: Math.max(0, Number(questions) || 0) });
          toast.success("Daily record saved");
        }}
      >
        <Save className="size-4" />
        Save daily record
      </Button>
    </AppShell>
  );
}
