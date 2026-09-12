import { Dashboard } from "@/components/dashboard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <Dashboard searchParams={await searchParams} />;
}
