import type { MeResponse } from "@/lib/api/auth";

export const ROLE_LABELS: Record<MeResponse["role"], string> = {
  VISITOR: "Külastaja",
  RECEPTIONIST: "Administraator",
  SECURITY_CHIEF: "Turvaülem",
  ADMIN: "Süsteemiadmin",
};

export interface CurrentUserDisplay {
  displayName: string;
  displayRole: string;
  roleLabel: string;
}

export function getRoleLabel(role: MeResponse["role"]): string {
  return ROLE_LABELS[role];
}

export function getCurrentUserDisplay(user: MeResponse): CurrentUserDisplay {
  const displayName = [user.person?.givenName, user.person?.surname]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  const displayRole = user.person?.jobTitle?.trim();
  const roleLabel = getRoleLabel(user.role);

  return {
    displayName: displayName || user.email,
    displayRole: displayRole || roleLabel,
    roleLabel,
  };
}
