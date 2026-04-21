import { NextResponse } from "next/server";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import {
  authSessionCookieName,
  createSignedSessionValue,
} from "@/lib/auth/access";

const apiClient = new SchedulerApiClient();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const identity = await apiClient.authenticateUser({ username, password });
    const sessionValue = await createSignedSessionValue(identity);
    const response = NextResponse.json(identity, { status: 200 });

    response.cookies.set({
      name: authSessionCookieName,
      value: sessionValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 401 },
    );
  }
}
