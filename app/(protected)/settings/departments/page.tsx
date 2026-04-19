"use client";

import { LookupManagerWrapper } from "@/components/admin/LookupManagerWrapper";
import { departmentsApi } from "@/lib/api/admin";

export default function DepartmentsPage() {
  return (
    <LookupManagerWrapper
      title="Halda osakondi"
      backHref="/settings"
      api={departmentsApi}
    />
  );
}
