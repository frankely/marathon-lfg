import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { buildAuthorizeUrl, COOKIE } from "@/lib/bungie";

export async function GET() {
  const state = randomBytes(24).toString("hex");
  const authorizeUrl = buildAuthorizeUrl(state);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE.state, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(authorizeUrl);
}
