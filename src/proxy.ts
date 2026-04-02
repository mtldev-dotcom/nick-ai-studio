import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthenticated = !!session;

  const protectedPaths = ["/gallery", "/generate", "/settings"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  const apiProtectedPaths = ["/api/jobs", "/api/generate", "/api/assets", "/api/settings"];
  const isApiProtectedPath = apiProtectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Webhook endpoints should be public (no auth required)
  const isWebhookPath = request.nextUrl.pathname.startsWith("/api/webhooks");

  if (!isWebhookPath && (isProtectedPath || isApiProtectedPath) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
