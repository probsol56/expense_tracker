import { redirect } from "next/navigation";
import { reportFormPath } from "@/lib/folio-reports";

/** /reports has no page of its own — land on the first report. */
export default function ReportsPage() {
  redirect(reportFormPath("account-ledger"));
}
