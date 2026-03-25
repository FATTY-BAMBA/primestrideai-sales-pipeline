-- ============================================
-- PrimeStride AI — Sales Pipeline Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Prospects table
create table if not exists prospects (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  staff_count text,
  industry text,
  signal_source text,
  notes text,
  score integer default 0,
  tier text check (tier in ('hot','warm','cold')) default 'cold',
  score_reason text,
  best_hook text,
  pipeline_stage text check (pipeline_stage in ('found','outreach','demo','pilot','closed','lost')) default 'found',
  product_fit text[] default '{}',
  location text,
  contact_name text,
  contact_email text,
  contact_linkedin text,
  last_touched timestamptz,
  created_at timestamptz default now()
);

-- Outreach log table
create table if not exists outreach_logs (
  id uuid default gen_random_uuid() primary key,
  prospect_id uuid references prospects(id) on delete cascade,
  template_used text,
  sent_at timestamptz default now(),
  channel text check (channel in ('email','linkedin','line')) default 'email',
  status text check (status in ('sent','opened','replied','bounced')) default 'sent',
  body text
);

-- Pipeline activities
create table if not exists activities (
  id uuid default gen_random_uuid() primary key,
  prospect_id uuid references prospects(id) on delete cascade,
  type text,
  note text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table prospects enable row level security;
alter table outreach_logs enable row level security;
alter table activities enable row level security;

-- Allow all for now (tighten with auth later)
create policy "Allow all" on prospects for all using (true);
create policy "Allow all" on outreach_logs for all using (true);
create policy "Allow all" on activities for all using (true);

-- Seed some example prospects
insert into prospects (company_name, staff_count, industry, signal_source, notes, score, tier, score_reason, best_hook, pipeline_stage, product_fit, location) values
('Sunrise Manufacturing Co.', '100-300', 'manufacturing', 'hr-job', 'Posted HR manager role on 104, currently using Excel + LINE', 92, 'hot', 'Sweet spot size, manufacturing OT complexity, active HR hiring signal, confirmed Excel/LINE', 'Lead with automated LSA OT tracking — Art.32 violations are their biggest risk', 'outreach', ARRAY['Atlas EIP'], 'Taichung'),
('Chen Foods Co.', '100-300', 'retail', 'lsa-mention', 'Found via Google Alert for 勞基法, mid-size retail chain', 88, 'hot', 'Good size, retail industry, strong LSA anxiety signal', 'Free handbook compliance scan — offer to find their violations before the inspector does', 'demo', ARRAY['Atlas EIP', 'AI Customer Assistant'], 'New Taipei'),
('MegaSteel Taiwan', '300-500', 'manufacturing', 'hr-job', 'Large manufacturer, 3 shifts, complex OT patterns', 96, 'hot', 'Manufacturing OT complexity, HR job post, confirmed Excel HR chaos', '拿出 Shadow Audit 功能 — 即時監控他們的加班超時風險', 'pilot', ARRAY['Atlas EIP', 'AI Knowledge Assistant'], 'Kaohsiung'),
('National University Taipei', '100-300', 'education', 'linkedin', 'Large private university, looking for EdTech solutions', 78, 'warm', 'Education sector = EduSense fit, good size, LinkedIn signal', 'Lead with EduSense AI Tutor — student struggle prediction demo', 'found', ARRAY['EduSense AI'], 'Taipei'),
('FastTrack Logistics', '20-100', 'logistics', 'lsa-mention', 'Delivery company, mentioned 勞工 issues on PTT', 81, 'hot', 'Logistics = complex driver OT rules, LSA anxiety, sweet spot size', 'Driver OT compliance is a minefield — Atlas EIP automates Art.32 tracking', 'outreach', ARRAY['Atlas EIP', 'OpenClaw'], 'Taipei'),
('PinPoint Professional Services', '20-100', 'professional', 'linkedin', 'Consulting firm, 60 staff, no obvious ERP', 71, 'warm', 'Professional services, good size, LinkedIn cold signal', 'AI Knowledge Assistant for SOP management — juniors stop interrupting seniors', 'found', ARRAY['AI Knowledge Assistant', 'Atlas EIP'], 'Taipei'),
('BrightRetail Chain', '100-300', 'retail', 'cold', 'Multi-location retail, high staff turnover', 74, 'warm', 'Retail size fit, high turnover = constant onboarding need', 'AI Customer Assistant — answer product questions at 3am without staff', 'found', ARRAY['AI Customer Assistant', 'OpenClaw'], 'Taoyuan'),
('TechBootcamp Taiwan', '20-100', 'education', 'referral', 'Coding bootcamp, referred by contact, looking for interview tools', 85, 'hot', 'Education + interview training = direct LyraAI fit, warm referral', 'LyraAI B2B license — give every student 50 mock interview sessions', 'demo', ARRAY['LyraAI'], 'Taipei');
