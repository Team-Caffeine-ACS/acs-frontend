"use client";

import { LookupManagerWrapper } from "@/components/admin/LookupManagerWrapper";
import { rolesApi } from "@/lib/api/admin";

export default function RolesPage() {
  return <LookupManagerWrapper title="Halda rolle" backHref="/settings" api={rolesApi} />;
}
