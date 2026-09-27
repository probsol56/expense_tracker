import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "@/lib/config";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  await supabase.auth.getUser();
  return response;
}

// Next.js requires this export to be named exactly `config`.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
