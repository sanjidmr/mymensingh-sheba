'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createServerSideClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'
import { getAuthErrorMessage } from '@/lib/auth-error-messages'

export async function registerUser(data: {
  fullName: string
  phone: string
  primaryAreaId?: string
  password: string
  email?: string
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'ডেটাবেজ সংযোগ নেই। Supabase কনফিগারেশন যাচাই করে আবার চেষ্টা করুন।' }
  }

  const email = (data.email?.trim() || '').toLowerCase() || `${data.phone}@mymensinghsheba.internal`
  const emailRedirectTo = new URL(
    '/auth/callback?next=/onboarding',
    getSiteUrl()
  ).toString()

  const supabase = await createServerSideClient()
  if (!supabase) {
    return { success: false, error: 'ডেটাবেজ সংযোগ নেই। Supabase কনফিগারেশন যাচাই করে আবার চেষ্টা করুন।' }
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: {
      data: {
        phone: data.phone,
        full_name: data.fullName,
        ...(data.primaryAreaId?.trim() ? { primary_area_id: data.primaryAreaId.trim() } : {}),
        email,
      },
      emailRedirectTo,
    },
  })

  if (signUpError) {
    return { success: false, error: getAuthErrorMessage(signUpError, 'register') }
  }

  if (!signUpData.user) {
    return { success: false, error: 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।' }
  }

  const userId = signUpData.user.id
  const hasSession = Boolean(signUpData.session)

  // If no session, try to auto-confirm using service role if available
  if (!hasSession && supabaseServiceKey) {
    try {
      const adminClient = createServerClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, {
        email_confirm: true,
      })
      if (!confirmError) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        })
        if (!signInError) {
          revalidatePath('/profile')
          return { success: true }
        }
      }
    } catch (err) {
      console.error('Error during auto-confirmation:', err)
    }
  }

  // Try to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: data.password,
  })
  if (signInError && supabaseServiceKey && !hasSession) {
    try {
      const adminClient = createServerClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      await adminClient.auth.admin.updateUserById(userId, { email_confirm: true })
      const { error: retrySignIn } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      })
      if (!retrySignIn) {
        revalidatePath('/profile')
        return { success: true }
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (signInError) {
    return { success: false, error: getAuthErrorMessage(signInError, 'login') }
  }

  revalidatePath('/profile')
  return { success: true }
}
