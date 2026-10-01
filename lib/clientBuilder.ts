import { ClientFormData, calculateAge } from "@/lib/schema";
import type { ClientRecord } from "@/lib/db";

export const STEP1_FIELDS: (keyof ClientFormData)[] = [
  "name", "gender", "dobDay", "dobMonth", "dobYear", "contact", "post", "address",
];

export function buildClientRecord(
  data: ClientFormData,
  submittedBy: string,
  isProfile = false
): ClientRecord {
  const dob = `${data.dobYear}-${String(data.dobMonth).padStart(2, "0")}-${String(
    data.dobDay
  ).padStart(2, "0")}`;
  return {
    id: "client-" + Math.random().toString(36).slice(2, 10),
    name: data.name,
    gender: data.gender,
    dob,
    age: calculateAge(data.dobDay, data.dobMonth, data.dobYear),
    contact: data.contact,
    reference: data.reference,
    post: data.post,
    address: data.address,
    state: data.state,
    district: data.district,
    taluka: data.taluka,
    city: data.city,
    ward: data.ward,
    submittedBy,
    submittedAt: new Date().toISOString(),
    isProfile,
  };
}
