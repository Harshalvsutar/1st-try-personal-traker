import { useMemo, useState } from "react";
import { Printer, X, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTracker, todayKey } from "@/lib/tracker-store";

interface StudyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DateRangeOption = "7d" | "30d" | "90d" | "all";

export function StudyReportModal({ open, onOpenChange }: StudyReportModalProps) {
  const { data, dayScore } = useTracker();
  const [range, setRange] = useState<DateRangeOption>("30d");

  const recordsList = useMemo(() => {
    const today = new Date();
    let daysToInclude = 30;
    if (range === "7d") daysToInclude = 7;
    else if (range === "90d") daysToInclude = 90;
    else if (range === "all") daysToInclude = 730; // 2 years

    const cutoff = new Date();
    cutoff.setDate(today.getDate() - daysToInclude);
    const cutoffKey = todayKey(cutoff);

    return Object.entries(data.records)
      .filter(([dateKey]) => dateKey >= cutoffKey)
      .sort(([a], [b]) => b.localeCompare(a));
  }, [data.records, range]);

  const summary = useMemo(() => {
    let totalSessions = 0;
    let totalFocusMinutes = 0;
    let totalQuestions = 0;
    let totalTopicsDone = 0;
    let totalTopicsCount = 0;
    let activeDays = 0;

    for (const [key, record] of recordsList) {
      totalSessions += record.sessions;
      totalFocusMinutes += record.focusMinutes;
      totalQuestions += record.questions;
      const done = record.topics.filter((t) => t.done).length;
      totalTopicsDone += done;
      totalTopicsCount += record.topics.length;
      if (dayScore(key) > 0) activeDays++;
    }

    return {
      totalSessions,
      totalFocusMinutes,
      totalHours: (totalFocusMinutes / 60).toFixed(1),
      totalQuestions,
      totalTopicsDone,
      totalTopicsCount,
      activeDays,
    };
  }, [recordsList, dayScore]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0 sm:max-h-[85vh]">
        <DialogHeader className="border-b border-border p-4 sm:p-6 no-print">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="size-5 text-primary" /> Study Log & Heatmap PDF Report
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Print or save as a PDF document with detailed study progress and activity totals.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrint} className="gap-1.5 font-medium">
                <Printer className="size-4" /> Print / Save as PDF
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
              <Calendar className="size-3.5" /> Date range:
            </span>
            {(
              [
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "90d", label: "Last 90 Days" },
                { id: "all", label: "All Records" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  range === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Printable Report Container */}
        <div
          id="printable-report"
          className="p-6 space-y-6 text-foreground print:text-black print:p-0"
        >
          {/* Header block for Report */}
          <div className="border-b border-border pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  FocusGrove Study Progress Report
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Personal Productivity, Focus Sessions & Problem-Solving Log
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Report Date: {todayKey()}</p>
                <p>
                  Period:{" "}
                  {range === "7d"
                    ? "Past 7 Days"
                    : range === "30d"
                      ? "Past 30 Days"
                      : range === "90d"
                        ? "Past 90 Days"
                        : "Full History"}
                </p>
              </div>
            </div>
          </div>

          {/* Productivity Totals */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Performance Summary
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-card/60 p-3 print:bg-white print:border-gray-300">
                <p className="text-xs text-muted-foreground">Focus Time</p>
                <p className="text-xl font-bold text-primary print:text-emerald-700">
                  {summary.totalHours}{" "}
                  <span className="text-xs font-normal text-foreground">hrs</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {summary.totalFocusMinutes} minutes
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card/60 p-3 print:bg-white print:border-gray-300">
                <p className="text-xs text-muted-foreground">Focus Sessions</p>
                <p className="text-xl font-bold text-primary print:text-emerald-700">
                  {summary.totalSessions}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Completed cycles</p>
              </div>
              <div className="rounded-lg border border-border bg-card/60 p-3 print:bg-white print:border-gray-300">
                <p className="text-xs text-muted-foreground">Questions Solved</p>
                <p className="text-xl font-bold text-primary print:text-emerald-700">
                  {summary.totalQuestions}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Problems practiced</p>
              </div>
              <div className="rounded-lg border border-border bg-card/60 p-3 print:bg-white print:border-gray-300">
                <p className="text-xs text-muted-foreground">Active Study Days</p>
                <p className="text-xl font-bold text-primary print:text-emerald-700">
                  {summary.activeDays}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {recordsList.length} total logged
                </p>
              </div>
            </div>
          </div>

          {/* Daily Records Detailed Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Daily Activity & Study Log
              </h2>
              <span className="text-xs text-muted-foreground">
                {recordsList.length} days in period
              </span>
            </div>

            {recordsList.length === 0 ? (
              <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                No study records logged for this selected period.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground print:bg-gray-100">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Focus Time</th>
                      <th className="py-2.5 px-3 font-semibold">Sessions</th>
                      <th className="py-2.5 px-3 font-semibold">Questions</th>
                      <th className="py-2.5 px-3 font-semibold">Topics Covered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recordsList.map(([dateKey, record]) => {
                      const completedTopics = record.topics.filter((t) => t.done);
                      const isToday = dateKey === todayKey();
                      return (
                        <tr key={dateKey} className="hover:bg-muted/30">
                          <td className="py-2.5 px-3 font-mono font-medium whitespace-nowrap">
                            {dateKey}{" "}
                            {isToday && (
                              <span className="ml-1 text-[10px] text-primary">(Today)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {record.focusMinutes > 0 ? (
                              <span className="font-medium text-foreground">
                                {record.focusMinutes} min
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {record.sessions > 0 ? (
                              <span>{record.sessions}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {record.questions > 0 ? (
                              <span className="font-medium text-primary print:text-emerald-800">
                                {record.questions}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {record.topics.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-[11px] text-muted-foreground">
                                  {completedTopics.length} of {record.topics.length} done
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {record.topics.map((t) => (
                                    <span
                                      key={t.id}
                                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
                                        t.done
                                          ? "bg-primary/15 text-primary border border-primary/20 print:bg-emerald-50 print:text-emerald-900"
                                          : "bg-secondary text-muted-foreground"
                                      }`}
                                    >
                                      {t.done && <CheckCircle2 className="size-2.5" />}
                                      {t.text}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">
                                No topics logged
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-border flex justify-between text-[11px] text-muted-foreground">
            <span>FocusGrove • Offline-First Personal Study & Heatmap Tracker</span>
            <span>Generated locally</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
