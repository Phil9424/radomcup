import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Обработка разных типов callback
  if (type === 'recovery') {
    // Перенаправляем на страницу сброса пароля
    return NextResponse.redirect(new URL('/auth/reset-password', request.url))
  }

  // URL для редиректа после успешной аутентификации
  return NextResponse.redirect(new URL('/admin', request.url))
}
