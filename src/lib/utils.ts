import { Prospect } from './supabase'

export const PRODUCTS = [
  { id: 'atlas', name: 'Atlas EIP', tag: 'HR · LSA Compliance', color: '#6c63ff' },
  { id: 'lyra', name: 'LyraAI', tag: 'Voice Interview Coach', color: '#38bdf8' },
  { id: 'edusense', name: 'EduSense AI', tag: 'Education Intelligence', color: '#4ade80' },
  { id: 'customer', name: 'AI Customer Assistant', tag: 'Managed · 24/7', color: '#fb923c' },
  { id: 'knowledge', name: 'AI Knowledge Assistant', tag: 'Managed · Internal SOPs', color: '#fbbf24' },
  { id: 'openclaw', name: 'OpenClaw', tag: 'AI Marketing Automation', color: '#f472b6' },
]

export function scoreProspectLocally(data: {
  staff_count: string
  industry: string
  signal_source: string
  notes: string
}): { score: number; tier: 'hot' | 'warm' | 'cold'; reason: string; products: string[] } {
  let score = 0
  const reasons: string[] = []
  const products: string[] = []

  // Size scoring
  if (data.staff_count === '20-100') { score += 30; reasons.push('Sweet spot size (+30)') }
  else if (data.staff_count === '100-300') { score += 25; reasons.push('Good size fit (+25)') }
  else if (data.staff_count === '300-500') { score += 15; reasons.push('Large company (+15)') }
  else { score += 0 }

  // Industry scoring + product fit
  if (data.industry === 'manufacturing') {
    score += 25; reasons.push('Manufacturing OT complexity (+25)')
    products.push('Atlas EIP', 'AI Knowledge Assistant')
  } else if (data.industry === 'retail') {
    score += 20; reasons.push('High turnover retail (+20)')
    products.push('Atlas EIP', 'AI Customer Assistant', 'OpenClaw')
  } else if (data.industry === 'professional') {
    score += 20; reasons.push('Compliance-heavy services (+20)')
    products.push('Atlas EIP', 'AI Knowledge Assistant', 'LyraAI')
  } else if (data.industry === 'logistics') {
    score += 20; reasons.push('Driver OT complexity (+20)')
    products.push('Atlas EIP')
  } else if (data.industry === 'education') {
    score += 15; reasons.push('Education sector (+15)')
    products.push('EduSense AI', 'LyraAI')
  } else {
    score += 10; products.push('Atlas EIP')
  }

  // Signal scoring
  if (data.signal_source === 'hr-job') { score += 25; reasons.push('Active HR hiring (+25)') }
  else if (data.signal_source === 'lsa-mention') { score += 20; reasons.push('LSA anxiety signal (+20)') }
  else if (data.signal_source === 'referral') { score += 20; reasons.push('Warm referral (+20)') }
  else if (data.signal_source === 'linkedin') { score += 15; reasons.push('LinkedIn discovery (+15)') }
  else { score += 5 }

  // Notes bonus
  const n = data.notes.toLowerCase()
  if (n.includes('line') || n.includes('excel')) { score += 20; reasons.push('Confirmed Excel/LINE HR (+20)') }
  if (n.includes('lsa') || n.includes('勞基法') || n.includes('inspection')) { score += 10; reasons.push('Explicit LSA concern (+10)') }

  score = Math.min(score, 100)
  const tier = score >= 80 ? 'hot' : score >= 60 ? 'warm' : 'cold'

  return { score, tier, reason: reasons.join(' · '), products: Array.from(new Set(products)) }
}

export const OUTREACH_TEMPLATES = {
  'template-a': {
    label: 'Template A — HR job post',
    description: 'Company posted HR role on 104. Highest intent signal.',
    signal: 'hr-job',
    subject: '您在 104 徵人資，我們幫您解決他最頭痛的問題',
    body: `Hi [Name],

看到貴公司正在招募人資，恭喜業務成長。

我想直接說：台灣大多數 20–200 人的企業，人資每週要花 15–20 小時在 LINE 群組追簽核和 Excel 管假期——而 2026 年勞基法修正已生效，罰款最高 NT$100 萬。

我們的 Atlas EIP 讓員工用一句中文完成請假申請，AI 自動比對勞基法，30 秒取代 10 分鐘流程。

現在有 3 個月免費試用名額，不需要技術團隊，7 天上線。

30 分鐘的 demo 可以嗎？這週或下週都可以。

Abdoulie Fatty
PrimeStride AI | primestrideatlas.com
abdoulie@primestrideai.com`,
  },
  'template-b': {
    label: 'Template B — LSA signal',
    description: 'Company mentioned compliance issues publicly.',
    signal: 'lsa-mention',
    subject: '2026 勞基法修正——貴公司員工手冊有更新嗎？',
    body: `Hi [Name],

2026 年新規：家庭照顧假改為小時制、全勤獎金不可扣除。

多數企業的員工手冊還沒更新。勞動局抽查時，違規罰款 NT$2–100 萬。

Atlas EIP 有 AI 合規掃描功能：上傳 PDF，自動找出違規條款，附修正建議。

免費幫您掃描一次，不需要承諾任何事。只需要 5 分鐘。

Abdoulie Fatty
PrimeStride AI | primestrideatlas.com`,
  },
  'template-c': {
    label: 'Template C — Cold outreach',
    description: 'No specific signal. Short and direct.',
    signal: 'cold',
    subject: '台灣中小企業人資的 LINE 混亂問題',
    body: `Hi [Name],

貴公司規模大概是用 LINE 群組管請假、Excel 追假期餘額的階段嗎？

如果是，我們幫過幾家類似規模的台灣企業——從 LINE 混亂升級到 AI 自動化，通常 7 天內完成，比一張勞基法罰單還便宜。

有興趣看 15 分鐘的 demo 嗎？

Abdoulie`,
  },
  'template-lyra': {
    label: 'LyraAI — University / Bootcamp',
    description: 'For education institutions needing interview prep.',
    signal: 'education',
    subject: 'AI 語音面試教練——幫您的學生拿到 offer',
    body: `Hi [Name],

台灣的大學和培訓機構，學生畢業後面試準備往往不足——特別是英文面試和結構化回答。

LyraAI 是我們的語音 AI 面試教練平台：學生與 AI 面試官進行真實語音對話，評估 10 項職能（Meta/Google 標準），附完整錄音和進步追蹤。

企業授權方案，可為數百名學生提供大規模面試準備。

想看 15 分鐘的 demo 嗎？

Abdoulie Fatty
PrimeStride AI`,
  },
  'template-edusense': {
    label: 'EduSense AI — Universities',
    description: 'For universities wanting AI-powered learning analytics.',
    signal: 'education',
    subject: '學生在哪裡卡關？AI 教育情報平台幫您看到問卷看不到的事',
    body: `Hi [Name],

傳統問卷只能告訴您學生是否滿意——但無法告訴您他們在哪裡真正卡關。

EduSense AI 把每次學生互動轉換成數據：AI 課程難度地圖、每週知識缺口報告、學習風險預測——在學期結束前讓您知道哪些學生需要介入。

相當於 1.5 名兼職助教，費用僅 1/10。

想看實際 demo 嗎？

Abdoulie Fatty
PrimeStride AI`,
  },
  'template-customer-assistant': {
    label: 'AI Customer Assistant',
    description: 'For retail / services with high inbound enquiries.',
    signal: 'retail',
    subject: '深夜三點，客戶發問——您的網站可以自動回覆嗎？',
    body: `Hi [Name],

貴公司網站每天有多少客戶問題沒有即時得到回答？

我們的 AI 智能客服助理：0.5 秒回應、繁體中文原生、24/7 全天候、每週自動送出知識缺口報告。不需要技術團隊，7 天上線。

NT$X,XXX/月起，比一位兼職客服便宜。

免費試用 2 週嗎？

Abdoulie Fatty
PrimeStride AI | primestrideai.com`,
  },
  'template-openclaw': {
    label: 'OpenClaw — Marketing Automation',
    description: 'For companies with active ad spend needing automation.',
    signal: 'marketing',
    subject: '您的 Meta 廣告昨晚在燒錢——您知道嗎？',
    body: `Hi [Name],

凌晨 2 點，您的廣告 CPC 飆升 40%。您的員工在睡覺。預算繼續燒。

OpenClaw 是我們的 AI 行銷自動化服務：異常偵測自動暫停廣告、每週一競品廣告情報報告、LINE 指令直控 Meta/Google 後台。

NT$3,000/月起——比一次浪費的廣告預算還便宜。

30 分鐘 demo 嗎？

Abdoulie
PrimeStride AI`,
  },
  'followup-value': {
    label: 'Day 8 — Value email (no ask)',
    description: 'Pure value. 5 LSA violations checklist. No pitch.',
    signal: 'any',
    subject: '2026 勞基法合規自查清單（免費）',
    body: `Hi [Name],

不需要看 demo，這是我們整理的 2026 勞基法 5 個最常見違規點：

1. 加班費率低於 1.34 倍（很多手冊寫 1.3 倍）
2. 家庭照顧假仍規定以天計算（新規改小時制）
3. 全勤獎金規定可扣除（2026 起禁止）
4. 特休未依年資梯度給足（Art. 38）
5. 月加班超過 46 小時未書面同意（Art. 32）

如果有一項符合，貴公司現在就有合規風險。

我們的 AI 可以掃描您的員工手冊，5 分鐘內出報告。免費。

Abdoulie`,
  },
  'breakup': {
    label: 'Day 21 — Break-up message',
    description: 'Final touch. Creates urgency.',
    signal: 'any',
    subject: '最後一封信',
    body: `Hi [Name],

我不會再打擾您了。

只想留下一個數字：NT$1,000,000——這是勞基法單次違規最高罰款。

如果未來有需要，我在這裡。

Abdoulie | abdoulie@primestrideai.com`,
  },
}
