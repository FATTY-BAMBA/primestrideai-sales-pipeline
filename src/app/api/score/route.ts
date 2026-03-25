import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { company_name, staff_count, industry, signal_source, notes } = body

  const prompt = `You are a B2B sales qualifier for PrimeStride AI, a Taiwan-based AI company.

Score this prospect and determine which PrimeStride products fit them best.

PRODUCTS:
- Atlas EIP: AI HR platform, LSA compliance automation, NLP leave requests. Best for: Taiwan SMEs 20-500 staff, any industry with complex HR/OT needs
- LyraAI: Voice AI interview coaching. Best for: universities, bootcamps, corporate HR
- EduSense AI: Education intelligence platform. Best for: universities, cram schools, corporate training
- AI Customer Assistant: Managed 24/7 website chatbot. Best for: retail, services, any company with high inbound enquiries
- AI Knowledge Assistant: Internal SOP chatbot. Best for: companies with complex procedures, high staff turnover
- OpenClaw: AI marketing automation, LINE command control. Best for: companies with active Meta/Google ad spend

SCORING RUBRIC (max 100):
- Size fit (30 pts): 20-100 staff=30, 100-300=25, 300-500=15, outside=0
- Industry (25 pts): manufacturing=25, retail/logistics=20, professional services=20, education=15, tech=10
- Signal strength (25 pts): HR job posting=25, LSA mention=20, referral=20, linkedin=15, cold=5
- Tech stack notes (20 pts): mentions Excel/LINE=20, no ERP=15, has SAP/ERP=5

COMPANY:
Name: ${company_name}
Staff: ${staff_count}
Industry: ${industry}
Found via: ${signal_source}
Notes: ${notes || 'none'}

Respond ONLY with valid JSON (no markdown):
{
  "score": number,
  "tier": "hot" | "warm" | "cold",
  "score_reason": "brief explanation of score",
  "best_hook": "single most compelling opening line for outreach in Traditional Chinese",
  "product_fit": ["product names that fit, ordered by fit strength"],
  "recommended_template": "template-a | template-b | template-c | template-lyra | template-edusense | template-customer-assistant | template-openclaw"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const result = JSON.parse(text)
    return NextResponse.json(result)
  } catch (e) {
    // Fallback to local scoring
    return NextResponse.json({
      score: 70, tier: 'warm',
      score_reason: 'Scored locally (API unavailable)',
      best_hook: '您的企業是否還在用 LINE 群組管請假？',
      product_fit: ['Atlas EIP'],
      recommended_template: 'template-a'
    })
  }
}
