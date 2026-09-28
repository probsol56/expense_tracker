import { z } from "zod";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "cash", "investment"] as const;

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required.").max(100),
  account_type: z.enum(ACCOUNT_TYPES),
  institution: z.string().trim().max(100).optional().or(z.literal("")),
  starting_balance: z.coerce.number().finite("Starting balance must be a number."),
});

export const transferSchema = z
  .object({
    from_account_id: z.string().uuid("Select both accounts for the transfer."),
    to_account_id: z.string().uuid("Select both accounts for the transfer."),
    amount: z.coerce.number().positive("Transfer amount must be greater than zero."),
    date: z.string().date("Enter a valid date."),
    notes: z.string().trim().max(250).optional().or(z.literal("")),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: "Choose two different accounts.",
    path: ["to_account_id"],
  });

export const loanSchema = z.object({
  name: z.string().trim().min(1, "Loan name is required.").max(100),
  lender: z.string().trim().min(1, "Lender is required.").max(100),
  principal_amount: z.coerce.number().positive("Enter a valid loan amount."),
  date_started: z.string().date("Enter a valid date."),
  notes: z.string().trim().max(250).optional().or(z.literal("")),
  account_id: z.string().uuid("Select which account received the loan."),
});

export const loanUpdateSchema = loanSchema.extend({
  // A loan created before account tracking existed has no linked
  // disbursement yet; leaving the account blank keeps it that way.
  account_id: z.string().uuid("Select a valid account.").optional().or(z.literal("")),
});

export const loanPaymentSchema = z.object({
  loan_id: z.string().uuid("Select a loan to make a payment."),
  amount: z.coerce.number().positive("Payment amount must be greater than zero."),
  date: z.string().date("Enter a valid date."),
  notes: z.string().trim().max(250).optional().or(z.literal("")),
  account_id: z.string().uuid("Select which account is paying this off."),
});

export const importSchema = z.object({
  bank_account_id: z.string().uuid("Select a bank account."),
});

export const transactionSchema = z.object({
  merchant: z.string().trim().min(1).max(100),
  description: z.string().trim().max(250).optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  category: z.string().trim().min(1),
  date: z.string().min(1),
  account_id: z.string().uuid("Select an account."),
  loan_id: z.string().uuid().optional().or(z.literal("")),
});

export const recurringTransactionSchema = z
  .object({
    type: z.enum(["expense", "income"]),
    merchant: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1),
    amount: z.coerce.number().positive(),
    description: z.string().trim().max(250).optional().or(z.literal("")),
    account_id: z.string().uuid("Select an account."),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    weekdays: z.array(z.coerce.number().int().min(0).max(6)).optional(),
    day_of_month: z.coerce.number().int().min(1).max(31).optional(),
    skip_holidays: z.boolean(),
    start_date: z.string().min(1),
    end_date: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === "weekly" && !data.weekdays?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one weekday.", path: ["weekdays"] });
    }
    if (data.frequency === "monthly" && data.day_of_month === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Day of month is required.", path: ["day_of_month"] });
    }
    if (data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date can't be before the start date.", path: ["end_date"] });
    }
  });

export const holidaySchema = z.object({
  date: z.string().min(1),
  name: z.string().trim().min(1).max(100),
});

/** A record id from the URL (e.g. `?edit=`). Anything that isn't a UUID is treated as absent. */
export function parseRecordId(value: string | undefined): string | null {
  const parsed = z.string().uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}
