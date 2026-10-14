import { Link } from "@tanstack/react-router";
import { Timer, LayoutGrid, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Focus", icon: Timer },
  { to: "/dashboard", label: "Grid", icon: LayoutGrid },
  { to: "/study", label: "Study", icon: NotebookPen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <main className="flex-1 px-5 pt-8 pb-28">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur">
        <ul className="grid grid-cols-3">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
