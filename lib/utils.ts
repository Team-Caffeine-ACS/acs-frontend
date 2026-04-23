import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { StatusColor } from "./api/preRegistration";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(fullName: string): string {
  return fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("et-EE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusMeta(status: string): { color: StatusColor; label: string } {
  switch (status) {
    case "CHECKED_IN":     return { color: "emerald", label: "Sees" };
    case "CHECKED_OUT":    return { color: "slate",   label: "Väljas" };
    case "PRE_REGISTERED": return { color: "amber",   label: "Ootel" };
    case "CANCELLED":      return { color: "rose",    label: "Tühistatud" };
    default:               return { color: "slate",   label: status };
  }
}