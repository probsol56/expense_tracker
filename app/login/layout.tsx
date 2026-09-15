import type { Metadata } from "next";

const title = "Sign in";
const description = "Sign in to Wallo to record and understand your money — expenses, income, and loans in one calm ledger.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/login" },
  openGraph: { title, description, url: "/login" },
  twitter: { title, description },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
