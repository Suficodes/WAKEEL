"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ShieldCheck,
  AlertOctagon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/registry", label: "Agent Registry", icon: Boxes },
  { href: "/reviews", label: "Review Queue", icon: ShieldCheck },
  { href: "/incidents", label: "Incidents", icon: AlertOctagon },
  { href: "/reports", label: "Reports", icon: FileText },
];

interface SideNavProps {
  /** live badge counts keyed by href */
  counts?: Record<string, number>;
}

export function SideNav({ counts = {} }: SideNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Primary">
      <p className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Oversight
      </p>
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const count = counts[item.href];
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-brand/10 text-foreground shadow-xs ring-1 ring-brand/15"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className={cn("size-[18px]", active ? "text-brand" : "text-muted-foreground/80")} />
            <span className="flex-1">{item.label}</span>
            {count ? (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center font-mono text-[11px] tabular",
                  active
                    ? "bg-brand/15 text-brand"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
