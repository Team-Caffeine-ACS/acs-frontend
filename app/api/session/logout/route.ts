import { clearRefreshTokenCookie } from "@/lib/server/auth";

export async function POST() {
  await clearRefreshTokenCookie();
  return new Response(null, { status: 204 });
}
