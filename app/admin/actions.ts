"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const COOKIE = "receipts_admin";

export async function getToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function login(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const token = String(fd.get("passphrase") ?? "").trim();
  if (!token) return { error: "Enter the passphrase." };
  const { data, error } = await supabase().rpc("admin_check", { token });
  if (error || data !== true) return { error: "That passphrase didn't work." };
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
  redirect("/admin");
}

export async function approve(fd: FormData) {
  const token = await getToken();
  if (!token) redirect("/admin");
  const id = String(fd.get("id"));
  let entry: unknown;
  try {
    entry = JSON.parse(String(fd.get("entry")));
  } catch {
    redirect(`/admin?err=${encodeURIComponent("Entry JSON didn't parse.")}`);
  }
  const { error } = await supabase().rpc("admin_approve_submission", {
    token,
    submission: id,
    final_entry: entry,
  });
  if (error) redirect(`/admin?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  redirect(`/admin?ok=${encodeURIComponent("Approved and published.")}`);
}

export async function reject(fd: FormData) {
  const token = await getToken();
  if (!token) redirect("/admin");
  const { error } = await supabase().rpc("admin_reject_submission", {
    token,
    submission: String(fd.get("id")),
    note: String(fd.get("note") ?? "") || null,
  });
  if (error) redirect(`/admin?err=${encodeURIComponent(error.message)}`);
  redirect(`/admin?ok=${encodeURIComponent("Rejected.")}`);
}
