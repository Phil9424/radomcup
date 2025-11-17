import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { AdminPageClient } from "./client";

export default async function AdminPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", user.email)
    .single();

  if (adminError || !adminUser) {
    redirect("/auth/login?error=not_admin");
  }

  // Fetch all tournaments
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  return <AdminPageClient
    tournaments={tournaments || []}
    adminUser={adminUser}
    currentUserEmail={user.email}
  />;
}
