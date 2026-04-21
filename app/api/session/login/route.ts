import { NextResponse } from "next/server";
import type { LoginRequest } from "@/lib/api/auth";
import {
  type BackendAuthResponse,
  postAuthToBackend,
  readJsonResponse,
  setRefreshTokenCookie,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const credentials = (await request.json()) as LoginRequest;
    const backendResponse = await postAuthToBackend(
      "/api/auth/login",
      credentials,
    );
    const payload =
      await readJsonResponse<BackendAuthResponse>(backendResponse);

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload ?? { message: "Sisselogimine ebaõnnestus." },
        { status: backendResponse.status },
      );
    }

    if (!payload?.accessToken || !payload.refreshToken) {
      return NextResponse.json(
        { message: "Autentimisvastus oli vigane." },
        { status: 502 },
      );
    }

    await setRefreshTokenCookie(payload.refreshToken);

    return NextResponse.json(
      { accessToken: payload.accessToken },
      { status: backendResponse.status },
    );
  } catch {
    return NextResponse.json(
      { message: "Sisselogimine ebaõnnestus." },
      { status: 502 },
    );
  }
}
