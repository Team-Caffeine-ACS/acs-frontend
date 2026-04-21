import { NextResponse } from "next/server";
import {
  type BackendAuthResponse,
  clearRefreshTokenCookie,
  getRefreshTokenCookie,
  postAuthToBackend,
  readJsonResponse,
  setRefreshTokenCookie,
} from "@/lib/server/auth";

export async function POST() {
  try {
    const refreshToken = await getRefreshTokenCookie();

    if (!refreshToken) {
      await clearRefreshTokenCookie();
      return NextResponse.json(
        { message: "Seanss on aegunud. Palun logige uuesti sisse." },
        { status: 401 },
      );
    }

    const backendResponse = await postAuthToBackend("/api/auth/refresh", {
      refreshToken,
    });
    const payload =
      await readJsonResponse<BackendAuthResponse>(backendResponse);

    if (!backendResponse.ok) {
      await clearRefreshTokenCookie();
      return NextResponse.json(
        payload ?? { message: "Seanss on aegunud. Palun logige uuesti sisse." },
        { status: backendResponse.status },
      );
    }

    if (!payload?.accessToken || !payload.refreshToken) {
      await clearRefreshTokenCookie();
      return NextResponse.json(
        { message: "Autentimisvastus oli vigane." },
        { status: 502 },
      );
    }

    await setRefreshTokenCookie(payload.refreshToken);

    return NextResponse.json({ accessToken: payload.accessToken });
  } catch {
    await clearRefreshTokenCookie();
    return NextResponse.json(
      { message: "Seansi värskendamine ebaõnnestus." },
      { status: 502 },
    );
  }
}
