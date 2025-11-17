import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: adminUsers, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(adminUsers || []);
  } catch (error) {
    console.error("Error in admin-users API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { email, full_name, role } = await request.json();

    const { data: newAdmin, error } = await supabase
      .from("admin_users")
      .insert({
        email,
        full_name,
        role
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating admin user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newAdmin);
  } catch (error) {
    console.error("Error in admin-users POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
