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
