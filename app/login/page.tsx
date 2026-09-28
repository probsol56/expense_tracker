import { AUTH_LINK_ERROR } from "@/lib/auth-routes";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm linkError={error === AUTH_LINK_ERROR} />;
}
