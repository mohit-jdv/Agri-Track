import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoutes = [
  "/dashboard",
  "/booking",
  "/queue",
  "/procurement",
  "/centre/dashboard",
];

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !user) {
  const loginUrl = request.nextUrl.clone();

  const isCentreRoute =
    request.nextUrl.pathname.startsWith(
      "/centre/"
    );

  loginUrl.pathname = isCentreRoute
    ? "/centre/login"
    : "/farmer/login";

  loginUrl.searchParams.set(
    "redirect",
    request.nextUrl.pathname
  );

  return NextResponse.redirect(loginUrl);
}

  return response;
}

export const config = {
  matcher: [
  "/dashboard/:path*",
  "/booking/:path*",
  "/queue/:path*",
  "/procurement/:path*",
  "/centre/dashboard/:path*",
],
};