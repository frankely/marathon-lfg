import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/bungie";
import { clearIdentityCookie } from "@/lib/session";

async function clear(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE.access);
  cookieStore.delete(COOKIE.membership);
  cookieStore.delete(COOKIE.expires);
  cookieStore.delete(COOKIE.state);
  await clearIdentityCookie();
  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
}

export async function GET(request: NextRequest) {
  return clear(request);
}

export async function POST(request: NextRequest) {
  return clear(request);
}
