'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, Prospect } from '@/lib/supabase'
import { OUTREACH_TEMPLATES, PRODUCTS, scoreProspectLocally } from '@/lib/utils'

const STAGES = ['found','outreach','demo','pilot','closed'] as const
const STAGE_LABELS: Record<string, string> = { found:'Found', outreach:'Outreach', demo:'Demo', pilot:'Pilot', closed:'Closed' }
const STAGE_COLORS: Record<string, string> = { found:'var(--text2)', outreach:'var(--accent-blue)', demo:'var(--gold)', pilot:'var(--accent-orange)', closed:'var(--accent-green)' }

const TIER_COLOR: Record<string, string> = { hot:'var(--accent-green)', warm:'var(--gold)', cold:'var(--text3)' }
const PRODUCT_COLORS: Record<string, string> = {
  'Atlas EIP':'#6c63ff','LyraAI':'#38bdf8','EduSense AI':'#4ade80',
  'AI Customer Assistant':'#fb923c','AI Knowledge Assistant':'#fbbf24','OpenClaw':'#f472b6'
}

export default function Home() {
  const [activePanel, setActivePanel] = useState('dashboard')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState('template-a')
  const [emailBody, setEmailBody] = useState(OUTREACH_TEMPLATES['template-a'].body)
  const [emailSubject, setEmailSubject] = useState(OUTREACH_TEMPLATES['template-a'].subject)
  const [chatMessages, setChatMessages] = useState<{role:string,content:string}[]>([
    {role:'assistant', content:'你好 Abdoulie! I\'m your PrimeStride sales AI. I know all your products — Atlas EIP, LyraAI, EduSense AI, AI Customer Assistant, AI Knowledge Assistant, and OpenClaw. Ask me anything: objection handling, proposal drafting, prospect research, or outreach personalization.'}
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [finderForm, setFinderForm] = useState({ company_name:'', staff_count:'20-100', industry:'manufacturing', signal_source:'hr-job', notes:'', location:'' })
  const [scoreResult, setScoreResult] = useState<any>(null)
  const [scoringLoading, setScoringLoading] = useState(false)
  const [addingProspect, setAddingProspect] = useState(false)
  const [filterProduct, setFilterProduct] = useState('all')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadProspects() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [chatMessages])

  async function loadProspects() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('prospects').select('*').order('score', { ascending: false })
      if (error) console.error('Supabase error:', error.message)
      setProspects(data || [])
    } catch (e) {
      console.error('Failed to load prospects:', e)
      setProspects([])
    }
    setLoading(false)
  }

  async function updateStage(id: string, stage: string) {
    await supabase.from('prospects').update({ pipeline_stage: stage }).eq('id', id)
    setProspects(prev => prev.map(p => p.id === id ? {...p, pipeline_stage: stage as any} : p))
  }

  async function scoreAndAdd() {
    setScoringLoading(true)
    try {
      const res = await fetch('/api/score', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(finderForm) })
      const result = await res.json()
      setScoreResult({ ...result, ...finderForm })
    } catch {
      const local = scoreProspectLocally(finderForm)
      setScoreResult({ score: local.score, tier: local.tier, score_reason: local.reason, product_fit: local.products, best_hook: '貴公司是否還在用 LINE 管請假？', ...finderForm })
    }
    setScoringLoading(false)
  }

  async function addScoredProspect() {
    if (!scoreResult) return
    setAddingProspect(true)
    const prospect = {
      company_name: scoreResult.company_name,
      staff_count: scoreResult.staff_count,
      industry: scoreResult.industry,
      signal_source: scoreResult.signal_source,
      notes: scoreResult.notes,
      location: scoreResult.location,
      score: scoreResult.score,
      tier: scoreResult.tier,
      score_reason: scoreResult.score_reason,
      best_hook: scoreResult.best_hook,
      product_fit: scoreResult.product_fit || [],
      pipeline_stage: 'found' as const,
    }
    const { data } = await supabase.from('prospects').insert(prospect).select().single()
    if (data) setProspects(prev => [data, ...prev])
    setScoreResult(null)
    setFinderForm({ company_name:'', staff_count:'20-100', industry:'manufacturing', signal_source:'hr-job', notes:'', location:'' })
    setActivePanel('pipeline')
    setAddingProspect(false)
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    const newMessages = [...chatMessages, { role:'user', content: msg }]
    setChatMessages(newMessages)
    setChatLoading(true)
    try {
      const res = await fetch('/api/outreach', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })) }) })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role:'assistant', content: data.text }])
    } catch {
      setChatMessages(prev => [...prev, { role:'assistant', content:'API connection failed. Please check your ANTHROPIC_API_KEY.' }])
    }
    setChatLoading(false)
  }

  function loadTemplate(key: string) {
    setActiveTemplate(key)
    const t = OUTREACH_TEMPLATES[key as keyof typeof OUTREACH_TEMPLATES]
    if (t) { setEmailSubject(t.subject); setEmailBody(t.body) }
  }

  const filteredProspects = filterProduct === 'all' ? prospects : prospects.filter(p => p.product_fit?.includes(filterProduct))
  const byStage = (stage: string) => filteredProspects.filter(p => p.pipeline_stage === stage)
  const hotCount = prospects.filter(p => p.tier === 'hot').length
  const demoCount = prospects.filter(p => p.pipeline_stage === 'demo').length
  const pilotCount = prospects.filter(p => p.pipeline_stage === 'pilot').length

  // ── Styles ──
  const s = {
    app: { display:'grid', gridTemplateColumns:'210px 1fr', height:'100vh', overflow:'hidden' } as React.CSSProperties,
    sidebar: { background:'var(--bg2)', borderRight:'1px solid var(--border)', padding:'20px 12px', display:'flex', flexDirection:'column' as const, gap:'2px', overflow:'hidden' },
    logo: { fontFamily:'IBM Plex Mono', fontSize:'11px', fontWeight:700, color:'var(--accent)', letterSpacing:'.1em', marginBottom:'24px', padding:'0 8px' },
    navSection: { fontFamily:'IBM Plex Mono', fontSize:'9px', color:'var(--text3)', letterSpacing:'.15em', padding:'14px 8px 4px' },
    nav: (active:boolean): React.CSSProperties => ({ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'6px', fontSize:'13px', cursor:'pointer', color: active ? 'var(--accent)' : 'var(--text2)', background: active ? 'rgba(108,99,255,.15)' : 'transparent', border:'none', width:'100%', textAlign:'left' as const, transition:'all .15s' }),
    dot: (color?: string): React.CSSProperties => ({ width:'5px', height:'5px', borderRadius:'50%', background: color || 'currentColor', flexShrink:0 }),
    main: { overflow:'hidden', display:'flex', flexDirection:'column' as const },
    header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid var(--border)', flexShrink:0 },
    headerTitle: { fontSize:'17px', fontWeight:600 },
    headerSub: { fontFamily:'IBM Plex Mono', fontSize:'10px', color:'var(--text3)', letterSpacing:'.08em', marginTop:'2px' },
    panel: { flex:1, overflowY:'auto' as const, padding:'20px 24px' },
    card: { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px' },
    stat: { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px', flex:1 },
    btn: { padding:'7px 14px', borderRadius:'6px', fontSize:'12px', fontFamily:'IBM Plex Sans, sans-serif', cursor:'pointer', border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', transition:'all .15s' } as React.CSSProperties,
    btnPrimary: { padding:'7px 14px', borderRadius:'6px', fontSize:'12px', fontFamily:'IBM Plex Sans, sans-serif', cursor:'pointer', border:'1px solid var(--accent)', background:'var(--accent)', color:'#fff', transition:'all .15s' } as React.CSSProperties,
    input: { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'6px', padding:'8px 10px', fontSize:'12px', color:'var(--text)', outline:'none', marginBottom:'10px' } as React.CSSProperties,
    label: { fontFamily:'IBM Plex Mono', fontSize:'9px', color:'var(--text3)', letterSpacing:'.1em', display:'block', marginBottom:'4px' } as React.CSSProperties,
    sectionLabel: { fontFamily:'IBM Plex Mono', fontSize:'9px', color:'var(--text3)', letterSpacing:'.12em', marginBottom:'10px', marginTop:'16px' } as React.CSSProperties,
    badge: (color: string): React.CSSProperties => ({ display:'inline-block', fontSize:'10px', padding:'2px 7px', borderRadius:'4px', background:`${color}18`, color, fontFamily:'IBM Plex Mono', marginRight:'4px' }),
    prospectCard: { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 12px', marginBottom:'6px', cursor:'pointer' } as React.CSSProperties,
  }

  return (
    <div style={s.app}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>PRIME<span style={{color:'var(--text3)'}}>STRIDE</span></div>
        <div style={s.navSection}>PIPELINE</div>
        {[['dashboard','Dashboard'],['pipeline','Pipeline board'],['finder','Prospect finder']].map(([id,label]) => (
          <button key={id} style={s.nav(activePanel===id)} onClick={() => setActivePanel(id)}>
            <span style={s.dot()}/>  {label}
          </button>
        ))}
        <div style={s.navSection}>GROWTH</div>
        {[['outreach','Outreach templates'],['ai','AI assistant']].map(([id,label]) => (
          <button key={id} style={s.nav(activePanel===id)} onClick={() => setActivePanel(id)}>
            <span style={s.dot()}/> {label}
          </button>
        ))}
        <div style={s.navSection}>PRODUCTS</div>
        {PRODUCTS.map(p => (
          <button key={p.id} style={s.nav(false)} onClick={() => { setFilterProduct(p.name); setActivePanel('pipeline') }}>
            <span style={s.dot(p.color)}/> {p.name}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{...s.navSection, marginTop:0}}>SETUP</div>
        <button style={s.nav(false)} onClick={() => window.open('https://supabase.com','_blank')}>
          <span style={s.dot()}/> Supabase DB
        </button>
        <button style={s.nav(false)} onClick={() => window.open('https://vercel.com','_blank')}>
          <span style={s.dot()}/> Deploy Vercel
        </button>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* ── DASHBOARD ── */}
        {activePanel === 'dashboard' && (
          <>
            <div style={s.header}>
              <div>
                <div style={s.headerTitle}>Good morning, Abdoulie</div>
                <div style={s.headerSub}>PRIMESTRIDE AI PIPELINE · {new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).toUpperCase()}</div>
              </div>
              <button style={s.btnPrimary} onClick={() => setActivePanel('finder')}>+ Add prospect</button>
            </div>
            <div style={s.panel}>
              <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                <div style={s.stat}><div style={{fontSize:'24px', fontWeight:700, fontFamily:'IBM Plex Mono', color:'var(--accent)'}}>{prospects.length}</div><div style={{fontSize:'11px', color:'var(--text2)', marginTop:'2px'}}>Total prospects</div></div>
                <div style={s.stat}><div style={{fontSize:'24px', fontWeight:700, fontFamily:'IBM Plex Mono', color:'var(--accent-green)'}}>{hotCount}</div><div style={{fontSize:'11px', color:'var(--text2)', marginTop:'2px'}}>Hot prospects</div></div>
                <div style={s.stat}><div style={{fontSize:'24px', fontWeight:700, fontFamily:'IBM Plex Mono', color:'var(--gold)'}}>{demoCount}</div><div style={{fontSize:'11px', color:'var(--text2)', marginTop:'2px'}}>Demos booked</div></div>
                <div style={s.stat}><div style={{fontSize:'24px', fontWeight:700, fontFamily:'IBM Plex Mono', color:'var(--accent-orange)'}}>{pilotCount}</div><div style={{fontSize:'11px', color:'var(--text2)', marginTop:'2px'}}>Active pilots</div></div>
              </div>

              <div style={s.sectionLabel}>YOUR PRODUCTS</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'20px'}}>
                {PRODUCTS.map(p => (
                  <div key={p.id} style={{...s.card, cursor:'pointer', borderLeft:`3px solid ${p.color}`}} onClick={() => { setFilterProduct(p.name); setActivePanel('pipeline') }}>
                    <div style={{fontSize:'13px', fontWeight:600, marginBottom:'2px'}}>{p.name}</div>
                    <div style={{fontSize:'11px', color:'var(--text2)'}}>{p.tag}</div>
                    <div style={{fontSize:'11px', color:'var(--text3)', fontFamily:'IBM Plex Mono', marginTop:'6px'}}>
                      {prospects.filter(pr => pr.product_fit?.includes(p.name)).length} prospects
                    </div>
                  </div>
                ))}
              </div>

              <div style={s.sectionLabel}>HOT PROSPECTS — ACTION NOW</div>
              <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                {prospects.filter(p => p.tier === 'hot').slice(0,5).map(p => (
                  <div key={p.id} style={{...s.card, display:'flex', alignItems:'center', justifyContent:'space-between', borderLeft:`3px solid ${TIER_COLOR[p.tier]}`}}>
                    <div>
                      <div style={{fontSize:'13px', fontWeight:600}}>{p.company_name}</div>
                      <div style={{fontSize:'11px', color:'var(--text2)', fontFamily:'IBM Plex Mono', marginTop:'2px'}}>{p.staff_count} staff · {p.industry} · Score: {p.score}</div>
                      <div style={{fontSize:'11px', color:'var(--text3)', marginTop:'4px', fontStyle:'italic'}}>{p.best_hook}</div>
                    </div>
                    <div style={{display:'flex', gap:'6px', flexShrink:0}}>
                      <button style={s.btn} onClick={() => { setActivePanel('outreach') }}>Draft email</button>
                      <select style={{...s.btn, padding:'4px 8px'}} value={p.pipeline_stage} onChange={e => updateStage(p.id!, e.target.value)}>
                        {STAGES.map(st => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {prospects.filter(p => p.tier === 'hot').length === 0 && <div style={{color:'var(--text3)', fontSize:'13px'}}>No hot prospects yet — add some in Prospect Finder.</div>}
              </div>

              <div style={{...s.card, marginTop:'20px', borderLeft:'3px solid var(--red)'}}>
                <div style={{fontSize:'13px', fontWeight:600, marginBottom:'8px'}}>2026 LSA Urgency — use in every Atlas EIP outreach</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px'}}>
                  {[['NT$1M','Max LSA fine'],['7 days','To deploy Atlas EIP'],['NT$700K','Subsidy available'],['2026','Law already active']].map(([v,l]) => (
                    <div key={l} style={{background:'var(--bg3)', borderRadius:'6px', padding:'10px', textAlign:'center'}}>
                      <div style={{fontSize:'16px', fontWeight:700, fontFamily:'IBM Plex Mono', color:'var(--red)'}}>{v}</div>
                      <div style={{fontSize:'10px', color:'var(--text2)', marginTop:'2px'}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PIPELINE ── */}
        {activePanel === 'pipeline' && (
          <>
            <div style={s.header}>
              <div>
                <div style={s.headerTitle}>Pipeline board</div>
                <div style={s.headerSub}>{filterProduct === 'all' ? 'ALL PRODUCTS' : filterProduct.toUpperCase()} · {filteredProspects.length} PROSPECTS</div>
              </div>
              <div style={{display:'flex', gap:'8px'}}>
                <select style={{...s.btn}} value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
                  <option value="all">All products</option>
                  {PRODUCTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <button style={s.btnPrimary} onClick={() => setActivePanel('finder')}>+ Add prospect</button>
              </div>
            </div>
            <div style={{...s.panel, overflowX:'auto'}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', minWidth:'900px'}}>
                {STAGES.map(stage => (
                  <div key={stage} style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
                      <span style={{fontFamily:'IBM Plex Mono', fontSize:'10px', color: STAGE_COLORS[stage], letterSpacing:'.1em'}}>{STAGE_LABELS[stage].toUpperCase()}</span>
                      <span style={{background:'var(--bg3)', borderRadius:'4px', padding:'1px 6px', fontSize:'10px', fontFamily:'IBM Plex Mono', color:'var(--text2)'}}>{byStage(stage).length}</span>
                    </div>
                    {byStage(stage).map(p => (
                      <div key={p.id} style={s.prospectCard}>
                        <div style={{fontSize:'12px', fontWeight:600, marginBottom:'3px'}}>{p.company_name}</div>
                        <div style={{fontSize:'10px', color:'var(--text2)', fontFamily:'IBM Plex Mono', marginBottom:'6px'}}>{p.staff_count} · {p.location || p.industry}</div>
                        <div style={{display:'flex', flexWrap:'wrap', gap:'3px', marginBottom:'6px'}}>
                          <span style={s.badge(TIER_COLOR[p.tier] || 'var(--text3)')}>{p.score}</span>
                          {(p.product_fit || []).slice(0,2).map(pf => <span key={pf} style={s.badge(PRODUCT_COLORS[pf] || 'var(--text3)')}>{pf.split(' ')[0]}</span>)}
                        </div>
                        <select style={{width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'4px', padding:'3px 6px', fontSize:'10px', color:'var(--text2)', cursor:'pointer'}} value={p.pipeline_stage} onChange={e => updateStage(p.id!, e.target.value)}>
                          {STAGES.map(st => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
                        </select>
                      </div>
                    ))}
                    {byStage(stage).length === 0 && <div style={{fontSize:'11px', color:'var(--text3)', padding:'8px 0', textAlign:'center'}}>Empty</div>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── FINDER ── */}
        {activePanel === 'finder' && (
          <>
            <div style={s.header}>
              <div>
                <div style={s.headerTitle}>Prospect finder</div>
                <div style={s.headerSub}>SCORE ANY COMPANY · AI DETERMINES PRODUCT FIT</div>
              </div>
            </div>
            <div style={{...s.panel, display:'grid', gridTemplateColumns:'320px 1fr', gap:'16px'}}>
              <div style={s.card}>
                <div style={s.sectionLabel}>COMPANY DETAILS</div>
                <label style={s.label}>COMPANY NAME</label>
                <input style={s.input} placeholder="e.g. Sunrise Manufacturing Co." value={finderForm.company_name} onChange={e => setFinderForm(f => ({...f, company_name: e.target.value}))} />
                <label style={s.label}>LOCATION (CITY)</label>
                <input style={s.input} placeholder="e.g. Taichung, Taipei, Kaohsiung" value={finderForm.location} onChange={e => setFinderForm(f => ({...f, location: e.target.value}))} />
                <label style={s.label}>STAFF COUNT</label>
                <select style={s.input} value={finderForm.staff_count} onChange={e => setFinderForm(f => ({...f, staff_count: e.target.value}))}>
                  <option value="20-100">20–100 staff</option>
                  <option value="100-300">100–300 staff</option>
                  <option value="300-500">300–500 staff</option>
                  <option value="500+">500+ staff</option>
                </select>
                <label style={s.label}>INDUSTRY</label>
                <select style={s.input} value={finderForm.industry} onChange={e => setFinderForm(f => ({...f, industry: e.target.value}))}>
                  <option value="manufacturing">Manufacturing / factory</option>
                  <option value="retail">Retail / services</option>
                  <option value="professional">Professional services</option>
                  <option value="logistics">Logistics / transport</option>
                  <option value="education">Education / training</option>
                  <option value="tech">Tech startup</option>
                  <option value="healthcare">Healthcare</option>
                </select>
                <label style={s.label}>HOW YOU FOUND THEM</label>
                <select style={s.input} value={finderForm.signal_source} onChange={e => setFinderForm(f => ({...f, signal_source: e.target.value}))}>
                  <option value="hr-job">104.com.tw HR job posting</option>
                  <option value="lsa-mention">LSA / 勞基法 keyword mention</option>
                  <option value="linkedin">LinkedIn search</option>
                  <option value="referral">Warm referral</option>
                  <option value="cold">Cold list</option>
                  <option value="inbound">Inbound / website</option>
                </select>
                <label style={s.label}>NOTES (any detail helps AI score better)</label>
                <input style={s.input} placeholder="e.g. uses LINE for HR, no ERP, mentioned 勞基法" value={finderForm.notes} onChange={e => setFinderForm(f => ({...f, notes: e.target.value}))} />
                <button style={{...s.btnPrimary, width:'100%'}} onClick={scoreAndAdd} disabled={scoringLoading || !finderForm.company_name}>
                  {scoringLoading ? 'Scoring with AI...' : 'Score this prospect →'}
                </button>
              </div>

              <div>
                {scoreResult && (
                  <div style={{...s.card, marginBottom:'16px', borderLeft:`3px solid ${TIER_COLOR[scoreResult.tier]}`}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
                      <div style={{fontSize:'16px', fontWeight:600}}>{scoreResult.company_name}</div>
                      <div style={{fontSize:'28px', fontWeight:700, fontFamily:'IBM Plex Mono', color: TIER_COLOR[scoreResult.tier]}}>{scoreResult.score} <span style={{fontSize:'13px'}}>{scoreResult.tier?.toUpperCase()}</span></div>
                    </div>
                    <div style={{fontSize:'12px', color:'var(--text2)', marginBottom:'10px'}}>{scoreResult.score_reason}</div>
                    <div style={{fontSize:'12px', fontStyle:'italic', color:'var(--text)', marginBottom:'12px', padding:'8px', background:'var(--bg3)', borderRadius:'6px'}}>Best hook: {scoreResult.best_hook}</div>
                    <div style={{marginBottom:'12px', display:'flex', flexWrap:'wrap', gap:'4px'}}>
                      {(scoreResult.product_fit || []).map((pf: string) => <span key={pf} style={s.badge(PRODUCT_COLORS[pf] || 'var(--text2)')}>{pf}</span>)}
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button style={s.btnPrimary} onClick={addScoredProspect} disabled={addingProspect}>{addingProspect ? 'Adding...' : 'Add to pipeline →'}</button>
                      <button style={s.btn} onClick={() => setScoreResult(null)}>Discard</button>
                    </div>
                  </div>
                )}

                <div style={s.sectionLabel}>WHERE TO FIND PROSPECTS</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {[
                    ['104.com.tw', 'Search HR manager job postings. Companies hiring HR = growing + feeling the pain. Filter: Taiwan, 20–500 staff.', '#6c63ff'],
                    ['Google Alerts (繁體中文)', 'Keywords: 勞基法, 勞檢, 加班費, 請假系統, 人資軟體. Captures companies with active LSA anxiety.', '#38bdf8'],
                    ['LinkedIn company search', 'Taiwan, 20–500 employees, target industries. Connect with HR managers and GMs.', '#4ade80'],
                    ['PTT / Dcard', 'Search 勞基法, 人資. Real employee complaints = company needs Atlas EIP.', '#fb923c'],
                    ['iThome.com.tw', 'Taiwan tech news. Companies announcing digital transformation are buyers.', '#fbbf24'],
                    ['MOEA company registry', 'New company registrations in target industries. Fresh = no incumbent system.', '#f472b6'],
                  ].map(([title, desc, color]) => (
                    <div key={title as string} style={{...s.card, borderLeft:`2px solid ${color}`}}>
                      <div style={{fontSize:'12px', fontWeight:600, marginBottom:'4px'}}>{title}</div>
                      <div style={{fontSize:'11px', color:'var(--text2)', lineHeight:1.5}}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── OUTREACH ── */}
        {activePanel === 'outreach' && (
          <>
            <div style={s.header}>
              <div>
                <div style={s.headerTitle}>Outreach templates</div>
                <div style={s.headerSub}>ALL PRODUCTS · TRADITIONAL CHINESE + ENGLISH</div>
              </div>
            </div>
            <div style={{...s.panel, display:'grid', gridTemplateColumns:'240px 1fr', gap:'16px'}}>
              <div>
                <div style={s.sectionLabel}>ATLAS EIP</div>
                {['template-a','template-b','template-c','followup-value','breakup'].map(key => {
                  const t = OUTREACH_TEMPLATES[key as keyof typeof OUTREACH_TEMPLATES]
                  return (
                    <div key={key} onClick={() => loadTemplate(key)} style={{...s.card, cursor:'pointer', marginBottom:'6px', borderColor: activeTemplate === key ? 'var(--accent)' : 'var(--border)'}}>
                      <div style={{fontSize:'12px', fontWeight:600, marginBottom:'2px'}}>{t.label}</div>
                      <div style={{fontSize:'11px', color:'var(--text2)', lineHeight:1.4}}>{t.description}</div>
                    </div>
                  )
                })}
                <div style={s.sectionLabel}>OTHER PRODUCTS</div>
                {['template-lyra','template-edusense','template-customer-assistant','template-openclaw'].map(key => {
                  const t = OUTREACH_TEMPLATES[key as keyof typeof OUTREACH_TEMPLATES]
                  return (
                    <div key={key} onClick={() => loadTemplate(key)} style={{...s.card, cursor:'pointer', marginBottom:'6px', borderColor: activeTemplate === key ? 'var(--accent)' : 'var(--border)'}}>
                      <div style={{fontSize:'12px', fontWeight:600, marginBottom:'2px'}}>{t.label}</div>
                      <div style={{fontSize:'11px', color:'var(--text2)', lineHeight:1.4}}>{t.description}</div>
                    </div>
                  )
                })}
              </div>
              <div style={s.card}>
                <div style={{fontFamily:'IBM Plex Mono', fontSize:'11px', color:'var(--text3)', padding:'8px 10px', background:'var(--bg3)', borderRadius:'6px', marginBottom:'10px'}}>Subject: {emailSubject}</div>
                <textarea
                  style={{width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'6px', padding:'12px', fontSize:'13px', color:'var(--text)', lineHeight:1.75, minHeight:'320px', outline:'none', resize:'vertical', fontFamily:'IBM Plex Sans, sans-serif'}}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                />
                <div style={{display:'flex', gap:'8px', marginTop:'10px'}}>
                  <button style={s.btnPrimary} onClick={() => { navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`).then(() => alert('Copied to clipboard!')) }}>Copy email</button>
                  <button style={s.btn} onClick={() => { setChatInput(`Personalize this outreach for a company in the ${finderForm.industry} industry with ${finderForm.staff_count} staff: "${emailSubject}"`); setActivePanel('ai') }}>Personalize with AI ↗</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── AI ASSISTANT ── */}
        {activePanel === 'ai' && (
          <>
            <div style={s.header}>
              <div>
                <div style={s.headerTitle}>AI sales assistant</div>
                <div style={s.headerSub}>POWERED BY CLAUDE · FULL PRIMESTRIDE CONTEXT</div>
              </div>
            </div>
            <div style={{...s.panel, display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px', height:'calc(100vh - 69px)', overflow:'hidden'}}>
              <div style={{...s.card, display:'flex', flexDirection:'column', height:'100%', overflow:'hidden'}}>
                <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px', marginBottom:'12px'}}>
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{padding:'10px 13px', borderRadius:'8px', fontSize:'13px', lineHeight:1.65, maxWidth:'88%', whiteSpace:'pre-wrap', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? 'rgba(108,99,255,.2)' : 'var(--bg3)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none'}}>
                      {m.content}
                    </div>
                  ))}
                  {chatLoading && <div style={{padding:'10px 13px', borderRadius:'8px', fontSize:'13px', color:'var(--text3)', background:'var(--bg3)', border:'1px solid var(--border)', alignSelf:'flex-start', fontStyle:'italic'}}>Thinking...</div>}
                  <div ref={chatEndRef}/>
                </div>
                <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                  <input style={{...s.input, margin:0, flex:1}} placeholder="Ask about objections, proposals, outreach, prospects..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                  <button style={s.btnPrimary} onClick={sendChat} disabled={chatLoading}>Send</button>
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'6px', overflowY:'auto'}}>
                <div style={s.sectionLabel}>QUICK ACTIONS</div>
                {[
                  ['Personalize Atlas EIP email for a 180-staff manufacturer in Taoyuan who posted HR job on 104 this week', 'Personalize Template A for manufacturer'],
                  ['Best response to objection: 我們已經有 ERP 系統了 (We already have ERP)', 'Handle "we have ERP" objection'],
                  ['Draft 90-day pilot proposal for a 150-staff retail company in Taipei using LINE for HR approvals', 'Draft pilot proposal (retail)'],
                  ['Write a LinkedIn post in Traditional Chinese about 2026 LSA update that positions PrimeStride as the expert', 'Write LSA LinkedIn post'],
                  ['What is the best approach to sell LyraAI to a Taiwan university vs a bootcamp?', 'LyraAI university vs bootcamp pitch'],
                  ['How should I pitch EduSense AI to a school that already uses a basic LMS?', 'EduSense AI vs LMS objection'],
                  ['Write a cold outreach for OpenClaw targeting a retail brand with active Meta ads', 'OpenClaw cold outreach'],
                  ['Which industries in Taiwan should I prioritize for AI Customer Assistant this quarter?', 'AI Customer Assistant targeting'],
                ].map(([prompt, label]) => (
                  <button key={label as string} style={{...s.btn, textAlign:'left', fontSize:'12px', padding:'8px 10px'}} onClick={() => { setChatInput(prompt as string); sendChat() }}>
                    {label} ↗
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
