"use client";

import { LookupManagerWrapper } from "@/components/admin/LookupManagerWrapper";
import { countriesApi } from "@/lib/api/admin";

export default function CountriesPage() {
  return (
    <LookupManagerWrapper
      title="Halda riike"
      backHref="/settings"
      api={countriesApi}
    />
  );
}
