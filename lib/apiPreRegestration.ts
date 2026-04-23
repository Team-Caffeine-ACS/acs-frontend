import { cookies } from "next/headers";
import { PreRegistration, PreRegistrationsResponse } from "./api/preRegistration";

const LIMIT = 5;

export async function fetchRecentVisitors(): Promise<PreRegistration[]> {
  const token = (await cookies()).get("token")?.value;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/pre-registrations?size=${LIMIT}&page=0`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const json: PreRegistrationsResponse = await res.json();
    return json.content.slice(0, LIMIT);
  } catch {
    return [];
  }
}