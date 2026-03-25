import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
