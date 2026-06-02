import type { User } from "./types";

export function isGlobalAdmin(user: User | { email: string } | null | undefined) {
  if (!user?.email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(user.email.toLowerCase());
}
