"use client";

import { LookupManagerWrapper } from "@/components/admin/LookupManagerWrapper";
import { organizationsApi } from "@/lib/api/admin";

export default function OrganizationsPage() {
  return (
    <LookupManagerWrapper
      title="Halda organisatsioone"
      backHref="/settings"
      api={organizationsApi}
    />
  );
}
