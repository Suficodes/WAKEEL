import { formatDistanceToNowStrict, format } from "date-fns";

export function relativeTime(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function shortDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, HH:mm");
}

export function dateOnly(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}

export function confidencePct(c: number | null): string {
  return c == null ? "—" : `${Math.round(c * 100)}%`;
}

export function titleCaseAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
