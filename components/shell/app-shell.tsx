import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { SideNav } from "./side-nav";
import { SystemPulse } from "./system-pulse";
import { ThemeToggle } from "./theme-toggle";

interface AppShellProps {
  children: React.ReactNode;
  navCounts?: Record<string, number>;
}

/**
 * Persistent app frame: fixed left rail (brand + nav), top bar (live pulse,
 * theme), scrolling content. Borders over shadows; cool ink surfaces.
 */
export function AppShell({ children, navCounts }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-hairline bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-hairline px-6">
          <Link href="/" className="focus-visible:outline-none">
            <BrandMark />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideNav counts={navCounts} />
        </div>
        <div className="border-t border-hairline px-6 py-4">
          <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
            Governance layer for agentic AI.
            <br />
            Evidence &amp; accountability.
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-hairline px-6 md:px-8">
          <div className="md:hidden">
            <BrandMark compact />
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2.5">
            <SystemPulse />
            <ThemeToggle />
          </div>
        </header>
        <main className="wakeel-surface flex-1 px-6 py-10 md:px-10">{children}</main>
      </div>
    </div>
  );
}
