import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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
    const { email, full_name, password, role } = await request.json();

    // Проверяем наличие пароля
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    // Пытаемся использовать Admin API, если доступен сервисный ключ
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let authData: { user: any } | null = null;
    let signUpError: any = null;

    if (serviceRoleKey) {
      // Используем Admin API для создания пользователя без подтверждения email
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return NextResponse.json(
          { error: "Supabase URL не настроен" },
          { status: 500 }
        );
      }

      const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Автоматически подтверждаем email для админов
        user_metadata: {
          full_name: full_name,
        },
      });

      authData = data;
      signUpError = error;
    } else {
      // Используем обычный signUp, если нет сервисного ключа
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name,
          },
          email_redirect_to: undefined, // Не отправляем email для подтверждения
        },
      });

      authData = data;
      signUpError = error;
    }

    if (signUpError) {
      console.error("Error creating auth user:", signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: "Не удалось создать пользователя" },
        { status: 500 }
      );
    }

    // Создаем запись в таблице admin_users
    const { data: newAdmin, error: adminError } = await supabase
      .from("admin_users")
      .insert({
        email: authData.user.email!,
        full_name,
        role
      })
      .select()
      .single();

    if (adminError) {
      console.error("Error creating admin user:", adminError);
      // Если не удалось создать запись в admin_users и есть сервисный ключ, удаляем пользователя из Auth
      if (serviceRoleKey && authData.user.id) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });
          await adminClient.auth.admin.deleteUser(authData.user.id);
        }
      }
      return NextResponse.json(
        { error: adminError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(newAdmin);
  } catch (error) {
    console.error("Error in admin-users POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
