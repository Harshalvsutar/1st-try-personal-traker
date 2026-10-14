import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Watch,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenTitle } from "@/components/app-shell";
import { GrowingTree } from "@/components/growing-tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTracker } from "@/lib/tracker-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focus & Stopwatch | FocusGrove" },
      {
        name: "description",
        content:
          "Customizable Pomodoro focus timer, tree growth visualizer, and precision stopwatch with lap logging.",
      },
      { property: "og:title", content: "Focus & Stopwatch | FocusGrove" },
      {
        property: "og:description",
        content: "Grow a tree while you focus or use the stopwatch with custom time presets.",
      },
    ],
  }),
  component: FocusScreen,
});

const PRESETS = [15, 25, 45, 60];

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatStopwatch(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

type StopwatchLap = {
  id: number;
  lapTime: number;
  totalTime: number;
};

const STOPWATCH_STORAGE_KEY = "focusgrove.stopwatch.v1";

function FocusScreen() {
  const { data, ready, today, setTimerMinutes, logSession } = useTracker();
  const [activeTab, setActiveTab] = useState<"pomodoro" | "stopwatch">("pomodoro");

  // --- Pomodoro Countdown State ---
  const minutes = data.timerMinutes;
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  // Custom minute input draft
  const [customMinutesInput, setCustomMinutesInput] = useState(String(minutes));

  useEffect(() => {
    setCustomMinutesInput(String(minutes));
  }, [minutes]);

  useEffect(() => {
    if (!running) setLeft(total);
  }, [total, running]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left === 0 && running && !doneRef.current) {
      doneRef.current = true;
      setRunning(false);
      logSession(minutes);
      toast.success("Session complete — your tree is fully grown!");
      setLeft(total);
      setTimeout(() => (doneRef.current = false), 500);
    }
  }, [left, running, minutes, total, logSession]);

  const progress = 1 - left / total;

  const handleApplyCustomMinutes = (newVal: number) => {
    const clamped = Math.min(180, Math.max(1, Math.round(newVal)));
    setTimerMinutes(clamped);
    setCustomMinutesInput(String(clamped));
    if (!running) {
      setLeft(clamped * 60);
    }
    toast.info(`Timer set to ${clamped} minutes`);
  };

  const handleStepMinutes = (delta: number) => {
    if (running) return;
    const current = Number(customMinutesInput) || minutes;
    handleApplyCustomMinutes(current + delta);
  };

  // --- Stopwatch State & Persistence ---
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<StopwatchLap[]>([]);
  const swLastLapTotal = useRef(0);

  // Restore stopwatch state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STOPWATCH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.time === "number") setSwTime(parsed.time);
        if (Array.isArray(parsed.laps)) setSwLaps(parsed.laps);
        if (typeof parsed.lastLapTotal === "number") swLastLapTotal.current = parsed.lastLapTotal;
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save stopwatch changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STOPWATCH_STORAGE_KEY,
        JSON.stringify({
          time: swTime,
          laps: swLaps,
          lastLapTotal: swLastLapTotal.current,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [swTime, swLaps]);

  // Stopwatch ticker (100ms precision)
  useEffect(() => {
    if (!swRunning) return;
    const interval = setInterval(() => {
      setSwTime((prev) => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [swRunning]);

  const handleAddLap = () => {
    if (!swRunning && swTime === 0) return;
    const lapTime = swTime - swLastLapTotal.current;
    swLastLapTotal.current = swTime;
    const newLap: StopwatchLap = {
      id: swLaps.length + 1,
      lapTime,
      totalTime: swTime,
    };
    setSwLaps((prev) => [newLap, ...prev]);
  };

  const handleResetStopwatch = () => {
    setSwRunning(false);
    setSwTime(0);
    setSwLaps([]);
    swLastLapTotal.current = 0;
    try {
      localStorage.removeItem(STOPWATCH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleLogStopwatchAsFocus = () => {
    const elapsedMinutes = Math.floor(swTime / 60000);
    if (elapsedMinutes < 1) {
      toast.error("Stopwatch must run for at least 1 minute to log as focus time.");
      return;
    }
    logSession(elapsedMinutes);
    toast.success(`Logged ${elapsedMinutes} minute(s) to today's focus records!`);
  };

  return (
    <AppShell>
      {/* Mode Switcher */}
      <div className="mb-4 flex items-center justify-between">
        <ScreenTitle
          title={activeTab === "pomodoro" ? "Focus Timer" : "Stopwatch"}
          subtitle={
            ready
              ? `${today.sessions} session(s) • ${today.focusMinutes}m today`
              : "Loading your grove…"
          }
        />
        <div className="flex rounded-lg border border-border bg-secondary/80 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("pomodoro")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "pomodoro"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Timer className="size-3.5" /> Pomodoro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stopwatch")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "stopwatch"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Watch className="size-3.5" /> Stopwatch
          </button>
        </div>
      </div>

      {activeTab === "pomodoro" ? (
        /* POMODORO COUNTDOWN VIEW */
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <GrowingTree progress={running || left < total ? progress : 0} />
            <p className="mt-2 font-mono text-6xl font-semibold tabular-nums text-foreground">
              {formatCountdown(left)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {running
                ? "Stay on task — your tree is flourishing"
                : "Choose duration and plant your session"}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((m) => (
              <Button
                key={m}
                variant={m === minutes ? "default" : "secondary"}
                disabled={running}
                onClick={() => {
                  setTimerMinutes(m);
                  setCustomMinutesInput(String(m));
                }}
                className="font-medium"
              >
                {m}m
              </Button>
            ))}
          </div>

          {/* Custom Time Set Box & Steppers */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Custom Duration</span>
              <span>1 to 180 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={running || minutes <= 1}
                onClick={() => handleStepMinutes(-5)}
                aria-label="Decrease 5 minutes"
                className="size-10 shrink-0"
              >
                <Minus className="size-4" />
              </Button>

              <div className="relative flex-1">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={180}
                  disabled={running}
                  value={customMinutesInput}
                  onChange={(e) => setCustomMinutesInput(e.target.value)}
                  onBlur={() => {
                    const parsed = Number(customMinutesInput);
                    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 180) {
                      handleApplyCustomMinutes(parsed);
                    } else {
                      setCustomMinutesInput(String(minutes));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const parsed = Number(customMinutesInput);
                      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 180) {
                        handleApplyCustomMinutes(parsed);
                      }
                    }
                  }}
                  className="text-center font-mono font-medium text-base pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  min
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={running || minutes >= 180}
                onClick={() => handleStepMinutes(5)}
                aria-label="Increase 5 minutes"
                className="size-10 shrink-0"
              >
                <Plus className="size-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={running || Number(customMinutesInput) === minutes}
                onClick={() => {
                  const parsed = Number(customMinutesInput);
                  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 180) {
                    handleApplyCustomMinutes(parsed);
                  }
                }}
                className="text-xs px-3"
              >
                Set
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 font-medium" size="lg" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Pause" : left < total ? "Resume" : "Plant & focus"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setRunning(false);
                setLeft(total);
                if (left < total) toast("Session cancelled — the tree withered.");
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>
      ) : (
        /* STOPWATCH COUNT-UP VIEW */
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div
              className={`relative flex items-center justify-center rounded-full size-52 border-2 transition-all ${
                swRunning
                  ? "border-primary shadow-[0_0_24px_rgba(34,197,94,0.15)] bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="text-center">
                <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                  {formatStopwatch(swTime)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {swRunning ? "Tracking focus time…" : swTime > 0 ? "Paused" : "Ready to time"}
                </p>
              </div>
            </div>
          </div>

          {/* Stopwatch Controls */}
          <div className="flex gap-2">
            <Button
              className="flex-1 font-medium"
              size="lg"
              onClick={() => setSwRunning((r) => !r)}
            >
              {swRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
              {swRunning ? "Pause" : swTime > 0 ? "Resume" : "Start"}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              disabled={!swRunning && swTime === 0}
              onClick={handleAddLap}
              className="gap-1.5"
            >
              <Flag className="size-4" /> Lap
            </Button>

            <Button
              variant="outline"
              size="lg"
              disabled={swTime === 0 && !swRunning}
              onClick={handleResetStopwatch}
            >
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>

          {/* Log to Daily Focus Button */}
          {swTime >= 60000 && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {Math.floor(swTime / 60000)} minute(s) recorded
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Save elapsed time to today's focus stats
                </p>
              </div>
              <Button size="sm" onClick={handleLogStopwatchAsFocus} className="gap-1 font-medium">
                <CheckCircle2 className="size-3.5" /> Log Focus
              </Button>
            </div>
          )}

          {/* Laps List */}
          {swLaps.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider pb-1 border-b border-border">
                <span>Lap</span>
                <span>Split</span>
                <span>Total</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-border/60">
                {swLaps.map((lap) => (
                  <div
                    key={lap.id}
                    className="flex items-center justify-between py-2 text-xs font-mono"
                  >
                    <span className="text-muted-foreground">Lap {lap.id}</span>
                    <span className="text-primary font-medium">
                      +{formatStopwatch(lap.lapTime)}
                    </span>
                    <span className="text-foreground">{formatStopwatch(lap.totalTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today's Focus Overview Card */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Focus minutes today</p>
          <p className="text-2xl font-semibold text-primary">{today.focusMinutes}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Sessions completed</p>
          <p className="text-2xl font-semibold text-foreground">{today.sessions}</p>
        </div>
      </div>
    </AppShell>
  );
}
