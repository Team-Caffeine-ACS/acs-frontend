"use client";

import { LookupManagerWrapper } from "@/components/admin/LookupManagerWrapper";
import { documentTypesApi } from "@/lib/api/admin";

export default function DocumentTypesPage() {
  return (
    <LookupManagerWrapper
      title="Halda dokumendi tüüpe"
      backHref="/settings"
      api={documentTypesApi}
    />
  );
}
