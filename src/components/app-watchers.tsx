import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { todayKey, useTracker } from "@/lib/tracker-store";

async function notify(body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification("FocusGrove", { body, icon: "/icons/icon-192.png" });
    else new Notification("FocusGrove", { body, icon: "/icons/icon-192.png" });
  } catch {
    /* notifications unavailable */
  }
}

/** Daily reminder, storage warning and monthly backup nudge. */
export function AppWatchers() {
  const { ready, data, setReminder, saveError } = useTracker();
  const backupNudged = useRef(false);

  useEffect(() => {
    if (!ready || !data.reminder.enabled) return;
    const check = () => {
      const now = new Date();
      const key = todayKey(now);
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (data.reminder.lastShown === key || hm < data.reminder.time) return;
      setReminder({ lastShown: key });
      const msg = "Time to log today's study and focus.";
      toast(msg);
      void notify(msg);
    };
    check();
    const id = window.setInterval(check, 30_000);
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ready, data.reminder, setReminder]);

  useEffect(() => {
    if (saveError) toast.error("Couldn't save — phone storage may be full. Export a backup.");
  }, [saveError]);

  useEffect(() => {
    if (!ready || backupNudged.current) return;
    const hasData = Object.keys(data.records).length + data.personal.length > 5;
    if (!hasData) return;
    const last = data.lastBackup ? new Date(data.lastBackup).getTime() : 0;
    if (Date.now() - last > 30 * 86400_000) {
      backupNudged.current = true;
      toast("Monthly tip: export a backup from Study → ⋯ → Backup.");
    }
  }, [ready, data.lastBackup, data.records, data.personal.length]);

  return null;
}
