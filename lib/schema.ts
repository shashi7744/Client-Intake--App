import { z } from "zod";

const currentYear = new Date().getFullYear();

export const clientSchema = z.object({
  // Step 1 - personal info
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["Male", "Female"], {
    errorMap: () => ({ message: "Select male or female" }),
  }),
  dobDay: z.coerce.number().min(1, "Select day").max(31, "Select day"),
  dobMonth: z.coerce.number().min(1, "Select month").max(12, "Select month"),
  dobYear: z.coerce
    .number()
    .min(currentYear - 120, "Select year")
    .max(currentYear, "Select year"),

  contact: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),

  reference: z.string().optional(),
  post: z.string().min(1, "Post is required"),
  address: z.string().min(1, "Address is required"),

  // Step 2 - location info
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  taluka: z.string().min(1, "Taluka is required"),
  city: z.string().min(1, "City is required"),
  ward: z.string().min(1, "Ward is required"),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const complaintSchema = z.object({
  category: z.string().optional().default("General"),
  description: z.string().min(10, "Please describe the issue in a bit more detail"),
  photo: z.string().optional(),

  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  taluka: z.string().min(1, "Taluka is required"),
  city: z.string().min(1, "City is required"),
  ward: z.string().min(1, "Ward is required"),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;

// Helper to turn day/month/year into an age, used both for storage and display.
export function calculateAge(dobDay: number, dobMonth: number, dobYear: number): number {
  const today = new Date();
  const dob = new Date(dobYear, dobMonth - 1, dobDay);
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}
