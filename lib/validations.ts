import { z } from "zod";

export const transactionSchema = z.object({
  merchant: z.string().trim().min(1).max(100),
  description: z.string().trim().max(250).optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  category: z.string().trim().min(1),
  date: z.string().min(1),
  account_id: z.string().uuid("Select an account."),
  loan_id: z.string().uuid().optional().or(z.literal("")),
});
