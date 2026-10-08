import { z } from "zod";
import { RECEIPT_PATH_PATTERN } from "@/lib/receipts/constants";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "cash", "investment"] as const;

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required.").max(100),
  account_type: z.enum(ACCOUNT_TYPES),
  institution: z.string().trim().max(100).optional().or(z.literal("")),
  starting_balance: z.coerce.number().finite("Starting balance must be a number."),
});

export const deleteLedgerAccountSchema = z.object({
  account_id: z.string().uuid("Select a valid account."),
});

export const transferSchema = z
  .object({
    from_account_id: z.string().uuid("Select a valid source account.").optional().or(z.literal("")),
    from_account_name: z.string().trim().max(100, "Source name must be 100 characters or fewer.").optional().or(z.literal("")),
    to_account_id: z.string().uuid("Select a valid destination account.").optional().or(z.literal("")),
    to_account_name: z.string().trim().max(100, "Recipient name must be 100 characters or fewer.").optional().or(z.literal("")),
    amount: z.coerce.number().positive("Transfer amount must be greater than zero."),
    date: z.string().date("Enter a valid date."),
    notes: z.string().trim().max(250).optional().or(z.literal("")),
  })
  .superRefine((data, context) => {
    if (data.from_account_id && data.from_account_id === data.to_account_id) {
      context.addIssue({ code: "custom", message: "Choose two different accounts.", path: ["to_account_id"] });
    }
    if (!data.from_account_id && !data.from_account_name) {
      context.addIssue({ code: "custom", message: "Choose a source account or enter an external source.", path: ["from_account_name"] });
    }
    if (!data.to_account_id && !data.to_account_name) {
      context.addIssue({ code: "custom", message: "Choose a destination account or enter an external recipient.", path: ["to_account_name"] });
    }
    if (!data.from_account_id && !data.to_account_id) {
      context.addIssue({ code: "custom", message: "A transfer must include one of your accounts.", path: ["to_account_id"] });
    }
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

const emptyToNull = (value: unknown) => (value === "" || value === undefined ? null : value);

/** Receipt breakdown sent alongside a transaction; blank inputs mean "none". */
export const transactionReceiptFieldsSchema = z.object({
  tax_amount: z.preprocess(emptyToNull, z.coerce.number().finite().nonnegative("Tax can't be negative.").nullable()),
  discount_amount: z.preprocess(emptyToNull, z.coerce.number().finite().nonnegative("Discount can't be negative.").nullable()),
  receipt_path: z.preprocess(emptyToNull, z.string().regex(RECEIPT_PATH_PATTERN, "Invalid receipt.").nullable()),
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

// Keep in sync with Auth > Providers > Email > minimum password length in Supabase.
export const PASSWORD_MIN_LENGTH = 8;
// bcrypt, which Supabase Auth uses, ignores bytes past 72.
const PASSWORD_MAX_LENGTH = 72;
export const DELETE_ACCOUNT_CONFIRMATION = "DELETE";

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match.",
    path: ["confirm_password"],
  });

export const deleteAccountSchema = z.object({
  confirmation: z.literal(DELETE_ACCOUNT_CONFIRMATION, {
    errorMap: () => ({ message: `Type ${DELETE_ACCOUNT_CONFIRMATION} to confirm.` }),
  }),
});

/** A record id from the URL (e.g. `?edit=`). Anything that isn't a UUID is treated as absent. */
export function parseRecordId(value: string | undefined): string | null {
  const parsed = z.string().uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}
