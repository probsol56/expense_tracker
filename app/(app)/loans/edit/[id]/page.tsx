import { redirect } from "next/navigation";
import { parseRecordId } from "@/lib/validations";

export default async function EditLoanPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string }>;
}) {
    const [{ id }, { error }] = await Promise.all([params, searchParams]);
    const loanId = parseRecordId(id);
    if (!loanId) redirect("/loans");
    const errorQuery = error ? `&error=${encodeURIComponent(error)}` : "";
    redirect(`/loans?edit=${loanId}${errorQuery}`);
}