import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  _supabase = createClient(url, key)
  return _supabase
}

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars: SUPABASE_SERVICE_ROLE_KEY must be set')
  _supabaseAdmin = createClient(url, key)
  return _supabaseAdmin
}

// Keep named exports for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop]
  }
})

export type Prospect = {
  id?: string
  company_name: string
  staff_count: string
  industry: string
  signal_source: string
  notes: string
  score: number
  tier: 'hot' | 'warm' | 'cold'
  score_reason: string
  best_hook: string
  pipeline_stage: 'found' | 'outreach' | 'demo' | 'pilot' | 'closed' | 'lost'
  product_fit: string[]
  location: string
  contact_name?: string
  contact_email?: string
  contact_linkedin?: string
  last_touched?: string
  created_at?: string
}

export type OutreachLog = {
  id?: string
  prospect_id: string
  template_used: string
  sent_at: string
  channel: 'email' | 'linkedin' | 'line'
  status: 'sent' | 'opened' | 'replied' | 'bounced'
  body: string
}
