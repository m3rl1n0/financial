'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpensePrice, Category, PaymentMethod } from '@/types'
import {
  MONTHS, MONTHS_SHORT, RECUR, ACCENT,
  sYM, eYM, todayYM, TODAY,
  charges, chargeDate, fmt, fmt0, shortDate, monYear, endLabel,
  nextChargeOf, chargesTotal, chargesDone,
  totalForYM, catTotalForYM, getAmountForYM, buildCatMap, catOf, CAT_PALETTE,
} from '@/lib/cadenza'

// ── SVG icons ──────────────────────────────────────────────────────────────
const IconMenu = () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3.5" width="12" height="1"/><rect x="2" y="7.5" width="12" height="1"/><rect x="2" y="11.5" width="12" height="1"/></svg>
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M11.3 10.6l3 3-.7.7-3-3a4.5 4.5 0 1 1 .7-.7zM7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
const IconBell = () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M13 11l-1-1V7a4 4 0 0 0-3-3.9V3a1 1 0 0 0-2 0v.1A4 4 0 0 0 4 7v3l-1 1v1h10zm-5 3a1.5 1.5 0 0 0 1.5-1.5h-3A1.5 1.5 0 0 0 8 14z"/></svg>
const IconChevLeft = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 13L5 8l5-5 .7.7L6.4 8l4.3 4.3z"/></svg>
const IconChevRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3l5 5-5 5-.7-.7L9.6 8 5.3 3.7z"/></svg>
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 3v4.5H13v1H8.5V13h-1V8.5H3v-1h4.5V3z"/></svg>
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 11.5V13h1.5l6.4-6.4-1.5-1.5zM12.8 4.5a.7.7 0 0 0 0-1l-.8-.8a.7.7 0 0 0-1 0l-.8.8 1.5 1.5z"/></svg>
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h4v1h3v1h-1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4H3V3h3zm-1 2v9h6V4zm2 2h1v5H7zm2 0h1v5H9z"/></svg>
const IconClose = () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M12 4.7l-.7-.7L8 7.3 4.7 4l-.7.7L7.3 8 4 11.3l.7.7L8 8.7l3.3 3.3.7-.7L8.7 8z"/></svg>
const IconArrowUp = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3l4 4-.7.7L8.5 4.9V13h-1V4.9L4.7 7.7 4 7z"/></svg>
const IconArrowDown = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 13L4 9l.7-.7L7.5 11.1V3h1v8.1l2.8-2.8.7.7z"/></svg>
const IconOverview = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7 2H2v5h5zm7 0H9v5h5zM7 9H2v5h5zm7 0H9v5h5z"/></svg>
const IconList = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v1H2zm0 4h12v1H2zm0 4h12v1H2z"/></svg>
const IconCat = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" fill="none" stroke="currentColor"/></svg>

type Screen = 'overview' | 'list' | 'detail' | 'catg'
type SortKey = 'name' | 'amount' | 'next'

interface FormState {
  name: string; cat: string; amount: string; interval: string
  start: string; hasEnd: boolean; end: string; method: string; note: string
  isVariable: boolean; isPrestazione: boolean
  priceNewAmt: string; priceQty: string; priceFrom: string  // YYYY-MM
}

interface Props {
  initialExpenses: Expense[]
  initialCategories: Category[]
  initialMethods: PaymentMethod[]
  initialPrices: ExpensePrice[]
  userInitials: string
  userId: string
}

// ── styles ─────────────────────────────────────────────────────────────────
const btn = (bg: string, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  border: 'none', background: bg, color, cursor: 'pointer', fontFamily: 'inherit', ...extra
})

export default function CadenzaApp({ initialExpenses, initialCategories, initialMethods, initialPrices, userInitials, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods)
  const [prices, setPrices] = useState<ExpensePrice[]>(initialPrices)

  const [screen, setScreen] = useState<Screen>('overview')
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [selectedId, setSelectedId] = useState<string>(initialExpenses[0]?.id ?? '')
  const [backTo, setBackTo] = useState<Screen>('overview')
  const [navOpen, setNavOpen] = useState(true)
  const [trendMode, setTrendMode] = useState<'total' | 'category'>('total')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('next')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [hoverBar, setHoverBar] = useState(-1)

  // modals
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [form, setForm] = useState<FormState>({ name:'', cat: categories[0]?.key ?? 'bollette', amount:'', interval:'1', start:(() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01' })(), hasEnd:false, end:'', method: methods[0]?.label ?? 'Addebito SEPA', note:'', isVariable:false, isPrestazione:false, priceNewAmt:'', priceQty:'1', priceFrom:(() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0') })() })

  const [catEditor, setCatEditor] = useState({ open:false, mode:'add' as 'add'|'edit', id:'', key:'', label:'', color: CAT_PALETTE[0].color, tag_bg: CAT_PALETTE[0].tag_bg, tag_text: CAT_PALETTE[0].tag_text })
  const [payEditor, setPayEditor] = useState({ open:false, mode:'add' as 'add'|'edit', id:'', label:'' })

  const [saving, setSaving] = useState(false)

  // ── helpers ───────────────────────────────────────────────────────────────
  const C = buildCatMap(categories)
  const Y = new Date().getFullYear()
  const ms = MONTHS_SHORT
  const selYM = Y * 12 + monthIndex

  // ── actions ───────────────────────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function openAdd() {
    setForm({ name:'', cat: categories[0]?.key ?? 'bollette', amount:'', interval:'1', start:(() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01' })(), hasEnd:false, end:'', method: methods[0]?.label ?? 'Addebito SEPA', note:'', isVariable:false, isPrestazione:false, priceNewAmt:'', priceQty:'1', priceFrom:(() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0') })() })
    setModalMode('add'); setModalOpen(true)
  }

  function openEditFor(e: Expense) {
    const pad = (n: number) => String(n).padStart(2, '0')
    setForm({
      name: e.name, cat: e.cat, amount: String(e.amount).replace('.', ','),
      interval: String(e.interval),
      start: e.start_year + '-' + pad(e.start_month + 1) + '-' + pad(e.day),
      hasEnd: e.end_year == null,
      end: e.end_year ? (e.end_year + '-' + pad(e.end_month! + 1) + '-01') : '',
      method: e.method, note: e.note || '', isVariable: e.is_variable, isPrestazione: e.is_prestazione ?? false,
      priceNewAmt: '', priceQty: '1', priceFrom: (() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0') })()
    })
    setSelectedId(e.id); setModalMode('edit'); setModalOpen(true)
  }

  async function saveExpense() {
    const amt = parseFloat(String(form.amount).replace(/\./g, '').replace(',', '.')) || 0
    const sd = (form.start || (() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01' })()).split('-').map(Number)
    let end_year = null, end_month = null
    if (!form.hasEnd && form.end) {
      const ed = form.end.split('-').map(Number)
      end_year = ed[0]; end_month = ed[1] - 1
    }
    const payload = {
      user_id: userId, name: form.name || 'Nuova spesa', cat: form.cat, amount: amt,
      interval: parseInt(form.interval, 10) || 1,
      start_year: sd[0], start_month: (sd[1] || 1) - 1,
      end_year, end_month, day: sd[2] || 1, method: form.method, note: form.note,
      is_variable: form.isVariable, is_prestazione: form.isPrestazione
    }
    setSaving(true)
    let expenseId = selectedId
    if (modalMode === 'edit') {
      const { data, error } = await supabase.from('expenses').update(payload).eq('id', selectedId).select().single()
      if (error) { alert('Errore: ' + error.message); setSaving(false); return }
      if (!data) { alert('Salvataggio fallito (nessun dato restituito). Hai eseguito supabase-migration-v3.sql?'); setSaving(false); return }
      setExpenses(prev => prev.map(x => x.id === selectedId ? data : x))
    } else {
      const { data, error } = await supabase.from('expenses').insert(payload).select().single()
      if (error) { alert('Errore: ' + error.message); setSaving(false); return }
      if (!data) { alert('Inserimento fallito (nessun dato restituito).'); setSaving(false); return }
      setExpenses(prev => [...prev, data]); expenseId = data.id
    }

    // gestione variazione / registrazione importo
    const newAmt = parseFloat(String(form.priceNewAmt).replace(/\./g, '').replace(',', '.'))
    const qty = parseInt(form.priceQty) || 1
    if (form.priceFrom && !isNaN(newAmt) && newAmt > 0 && expenseId) {
      const [fy, fm] = form.priceFrom.split('-').map(Number)
      const fromYear = fy, fromMonth = fm - 1  // 0-indexed
      const totalAmt = form.isPrestazione ? newAmt * qty : newAmt

      if (form.isVariable || form.isPrestazione) {
        // spesa variabile: record per quel singolo mese (valid_to = valid_from)
        await supabase.from('expense_prices').insert({
          expense_id: expenseId, user_id: userId, amount: totalAmt,
          valid_from_year: fromYear, valid_from_month: fromMonth,
          valid_to_year: fromYear, valid_to_month: fromMonth
        })
      } else {
        // spesa fissa: chiudi il record aperto precedente e apri il nuovo
        const prevYM = fromYear * 12 + fromMonth - 1
        const prevYear = Math.floor(prevYM / 12), prevMonth = prevYM % 12
        await supabase.from('expense_prices')
          .update({ valid_to_year: prevYear, valid_to_month: prevMonth })
          .eq('expense_id', expenseId).is('valid_to_year', null)
        await supabase.from('expense_prices').insert({
          expense_id: expenseId, user_id: userId, amount: totalAmt,
          valid_from_year: fromYear, valid_from_month: fromMonth,
          valid_to_year: null, valid_to_month: null
        })
      }
      const { data: newPrices } = await supabase.from('expense_prices').select('*').eq('expense_id', expenseId)
      if (newPrices) setPrices(prev => [...prev.filter(p => p.expense_id !== expenseId), ...newPrices])
    }

    setSaving(false); setModalOpen(false)
  }

  async function deleteExpense(id: string) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(x => x.id !== id))
    setScreen(backTo || 'overview')
  }

  async function saveCat() {
    const label = (catEditor.label || '').trim() || 'Nuova categoria'
    if (catEditor.mode === 'edit') {
      const { data } = await supabase.from('categories').update({ label, color: catEditor.color, tag_bg: catEditor.tag_bg, tag_text: catEditor.tag_text }).eq('id', catEditor.id).select().single()
      if (data) setCategories(prev => prev.map(c => c.id === catEditor.id ? data : c))
    } else {
      const key = 'c' + Date.now()
      const { data } = await supabase.from('categories').insert({ user_id: userId, key, label, color: catEditor.color, tag_bg: catEditor.tag_bg, tag_text: catEditor.tag_text }).select().single()
      if (data) setCategories(prev => [...prev, data])
    }
    setCatEditor(s => ({ ...s, open: false }))
  }

  async function deleteCat(cat: Category) {
    if (expenses.some(e => e.cat === cat.key)) return
    await supabase.from('categories').delete().eq('id', cat.id)
    setCategories(prev => prev.filter(c => c.id !== cat.id))
  }

  async function savePay() {
    const label = (payEditor.label || '').trim(); if (!label) { setPayEditor(s => ({ ...s, open: false })); return }
    if (payEditor.mode === 'edit') {
      const old = methods.find(m => m.id === payEditor.id)?.label
      const { data } = await supabase.from('payment_methods').update({ label }).eq('id', payEditor.id).select().single()
      if (data) {
        setMethods(prev => prev.map(m => m.id === payEditor.id ? data : m))
        if (old && old !== label) {
          await supabase.from('expenses').update({ method: label }).eq('user_id', userId).eq('method', old)
          setExpenses(prev => prev.map(e => e.method === old ? { ...e, method: label } : e))
        }
      }
    } else {
      const { data } = await supabase.from('payment_methods').insert({ user_id: userId, label }).select().single()
      if (data) setMethods(prev => [...prev, data])
    }
    setPayEditor(s => ({ ...s, open: false }))
  }

  async function deletePay(m: PaymentMethod) {
    if (expenses.some(e => e.method === m.label)) return
    await supabase.from('payment_methods').delete().eq('id', m.id)
    setMethods(prev => prev.filter(x => x.id !== m.id))
  }

  function doSort(k: SortKey) {
    setSortDir(sortKey === k && sortDir === 'asc' ? 'desc' : 'asc'); setSortKey(k)
  }

  // ── derived data ──────────────────────────────────────────────────────────
  const monthTotal = totalForYM(selYM, expenses, prices)
  const prevTotal = totalForYM(selYM - 1, expenses, prices)
  const delta = monthTotal - prevTotal
  const deltaPct = prevTotal > 0 ? Math.round(delta / prevTotal * 100) : 0
  const up = delta > 0
  const activeCount = expenses.filter(e => selYM >= sYM(e) && (eYM(e) == null || selYM <= eYM(e)!)).length
  const chargingCount = expenses.filter(e => charges(e, selYM)).length

  const nxRef: { d: Date; e: Expense }[] = []
  expenses.forEach(exp => { const d = nextChargeOf(exp); if (d && (!nxRef[0] || d < nxRef[0].d)) nxRef[0] = { d, e: exp } })
  const nx = nxRef[0] ?? null

  const totals: number[] = []
  let yearTotal = 0
  for (let i = 0; i < 12; i++) { const t = totalForYM(Y * 12 + i, expenses, prices); totals.push(t); yearTotal += t }
  const avg = yearTotal / 12
  const maxTot = Math.max(...totals, 1)
  const H = 200

  const catKeys = categories.map(c => c.key)
  const xOf = (i: number) => ((i + 0.5) / 12 * 100)

  let lines: { color: string; points: string }[] = []
  let dots: { left: string; bottom: string; color: string }[] = []
  if (trendMode === 'category') {
    lines = catKeys.map(k => ({
      color: C[k]?.color ?? '#8d8d8d',
      points: totals.map((_, i) => {
        const v = catTotalForYM(k, Y * 12 + i, expenses, prices)
        return xOf(i).toFixed(2) + ',' + (100 - v / maxTot * 100).toFixed(2)
      }).join(' ')
    }))
  } else {
    const pts = totals.map((t, i) => xOf(i).toFixed(2) + ',' + (100 - t / maxTot * 100).toFixed(2)).join(' ')
    lines = [{ color: ACCENT, points: pts }]
    dots = totals.map((t, i) => ({ left: xOf(i).toFixed(2), bottom: (t / maxTot * H).toFixed(1), color: i === monthIndex ? ACCENT : '#a6c8ff' }))
  }
  const gridLines = [1, 0.75, 0.5, 0.25, 0].map(f => ({ label: fmt0(maxTot * f) }))

  // breakdown
  const bdRaw = catKeys.map(k => ({ k, label: C[k]?.label ?? k, color: C[k]?.color ?? '#8d8d8d', val: catTotalForYM(k, selYM, expenses, prices) })).filter(x => x.val > 0)
  const bdSum = bdRaw.reduce((a, b) => a + b.val, 0) || 1
  const breakdown = bdRaw.sort((a, b) => b.val - a.val).map(x => ({
    color: x.color, label: x.label, amount: fmt(x.val),
    pct: x.val / bdSum * 100, pctLabel: Math.round(x.val / bdSum * 100) + '%'
  }))

  // upcoming — escludi le spese variabili (importo non prevedibile)
  const today = TODAY()
  const upRaw: { d: Date; e: Expense }[] = []
  expenses.filter(e => !e.is_variable && !e.is_prestazione).forEach(e => {
    for (let k = 0; k < 14; k++) {
      const ym = todayYM() + k
      if (charges(e, ym)) { const d = chargeDate(e, ym); if (d >= today) { upRaw.push({ d, e }); break } }
    }
  })
  upRaw.sort((a, b) => a.d.getTime() - b.d.getTime())
  const upcoming = upRaw.slice(0, 6).map(o => {
    const cc = catOf(C, o.e.cat)
    const upYM = o.d.getFullYear() * 12 + o.d.getMonth()
    return { day: o.d.getDate(), mon: ms[o.d.getMonth()], name: o.e.name, catLabel: cc.label, tagBg: cc.tag_bg, tagText: cc.tag_text, amount: fmt(getAmountForYM(o.e, upYM, prices)) }
  })

  // table rows — filtrate per mese selezionato
  const activeExpenses = expenses.filter(e => {
    if (e.is_variable || e.is_prestazione) return sYM(e) <= selYM && (eYM(e) == null || eYM(e)! >= selYM)
    return charges(e, selYM)
  })
  let filtered = filter === 'all' ? activeExpenses.slice() : activeExpenses.filter(e => e.cat === filter)
  const dir = sortDir === 'asc' ? 1 : -1
  filtered.sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name) * dir
    if (sortKey === 'amount') return (a.amount - b.amount) * dir
    const da = nextChargeOf(a), db = nextChargeOf(b)
    return ((da ? da.getTime() : 9e15) - (db ? db.getTime() : 9e15)) * dir
  })
  const mapRow = (e: Expense) => {
    const nd = nextChargeOf(e); const cc = catOf(C, e.cat)
    const ndYM = nd ? nd.getFullYear() * 12 + nd.getMonth() : todayYM()
    return { id: e.id, name: e.name, color: cc.color, catLabel: cc.label, tagBg: cc.tag_bg, tagText: cc.tag_text, importo: fmt(getAmountForYM(e, ndYM, prices)), recur: RECUR[e.interval], inizio: monYear(e), fine: endLabel(e), method: e.method, prossimo: nd ? shortDate(nd) : '—', e }
  }
  const rows = filtered.map(mapRow)
  const monthRows = filtered.filter(e => charges(e, selYM)).map(mapRow)

  const filterTabs = [{ k: 'all', label: 'Tutte' }].concat(catKeys.map(k => ({ k, label: C[k]?.label ?? k }))).map(t => {
    const on = filter === t.k
    return { label: t.label, k: t.k, color: on ? '#161616' : '#525252', weight: on ? 600 : 400, bar: on ? ACCENT : 'transparent' }
  })

  const sortIcon = (k: SortKey) => {
    if (sortKey !== k) return null
    return sortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />
  }

  // detail
  const detailExp = expenses.find(x => x.id === selectedId) ?? expenses[0] ?? null
  const bankIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 5v1h14V5zM3 7v5H2v2h12v-2h-1V7h-2v5H9V7H7v5H5V7z"/></svg>
  const cardIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 4h14v2H1zm0 3h14v5H1zm2 3h4v1H3z"/></svg>
  const walletIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h10a1 1 0 0 1 1 1H2zm0 2h13v8H2zm9 3a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 11 8z"/></svg>
  const methodIcon = (m: string) => m.includes('Carta') ? cardIcon : m === 'PayPal' ? walletIcon : bankIcon

  const navDefs = [
    { label: 'Panoramica', screen: 'overview' as Screen, Icon: IconOverview },
    { label: 'Spese', screen: 'list' as Screen, Icon: IconList },
    { label: 'Categorie', screen: 'catg' as Screen, Icon: IconCat },
  ]

  const rowH = 48

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#f4f4f4', color:'#161616', fontSize:14, lineHeight:1.4, fontFamily:"var(--font-ibm-plex-sans), system-ui, sans-serif" }}>

      {/* HEADER */}
      <header style={{ flex:'none', height:48, background:'#161616', color:'#f4f4f4', display:'flex', alignItems:'center', borderBottom:'1px solid #393939' }}>
        <button onClick={() => setNavOpen(v => !v)} style={{ width:48, height:48, border:'none', background:'transparent', color:'#f4f4f4', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IconMenu />
        </button>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, paddingLeft:8 }}>
          <span style={{ fontSize:16, fontWeight:600, letterSpacing:'0.01em' }}>Cadenza</span>
          <span style={{ fontSize:14, color:'#8d8d8d' }}>Spese ricorrenti</span>
        </div>
        <div style={{ flex:1 }} />
        <button style={{ width:48, height:48, border:'none', background:'transparent', color:'#f4f4f4', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IconSearch />
        </button>
        <button style={{ width:48, height:48, border:'none', background:'transparent', color:'#f4f4f4', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <IconBell />
        </button>
        <button onClick={handleLogout} style={{ width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center', border:'none', background:'transparent', cursor:'pointer' }} title="Esci">
          <div style={{ width:28, height:28, borderRadius:'50%', background:'#393939', color:'#f4f4f4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600 }}>
            {userInitials}
          </div>
        </button>
      </header>

      <div style={{ flex:1, display:'flex', minHeight:0 }}>

        {/* SIDE NAV */}
        {navOpen && (
          <nav style={{ flex:'none', width:256, background:'#f4f4f4', borderRight:'1px solid #e0e0e0', display:'flex', flexDirection:'column', paddingTop:8 }}>
            {navDefs.map(n => {
              const on = (n.screen === 'overview' && (screen === 'overview' || (screen === 'detail' && backTo === 'overview')))
                || (n.screen === 'list' && (screen === 'list' || (screen === 'detail' && backTo === 'list')))
                || (n.screen === 'catg' && screen === 'catg')
              return (
                <button key={n.screen} onClick={() => setScreen(n.screen)}
                  style={{ height:48, border:'none', borderLeft:`3px solid ${on ? ACCENT : 'transparent'}`, background: on ? '#e0e0e0' : 'transparent', color:'#161616', cursor:'pointer', display:'flex', alignItems:'center', gap:12, padding:'0 16px', textAlign:'left', fontSize:14, fontWeight: on ? 600 : 400 }}>
                  <span style={{ width:16, height:16, display:'inline-flex', alignItems:'center', justifyContent:'center' }}><n.Icon /></span>
                  {n.label}
                </button>
              )
            })}
            <div style={{ flex:1 }} />
            <div style={{ padding:16, borderTop:'1px solid #e0e0e0', color:'#6f6f6f', fontSize:12, lineHeight:1.5 }}>
              <div style={{ fontFamily:'var(--font-ibm-plex-mono), monospace', color:'#8d8d8d' }}>{MONTHS[monthIndex]} {Y}</div>
              Aggiornato oggi · 19 giu
            </div>
          </nav>
        )}

        {/* MAIN */}
        <main style={{ flex:1, overflow:'auto', minWidth:0 }}>

          {/* ── OVERVIEW ── */}
          {screen === 'overview' && (
            <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 32px 64px' }}>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:12, letterSpacing:'0.32px', color:'#6f6f6f', textTransform:'uppercase', marginBottom:4 }}>Panoramica</div>
                  <h1 style={{ margin:0, fontSize:28, fontWeight:400, lineHeight:1.25 }}>Quanto spendo questo mese</h1>
                </div>
                <div style={{ display:'flex', alignItems:'stretch', gap:8 }}>
                  <MonthPicker monthIndex={monthIndex} onChange={setMonthIndex} />
                  <button onClick={openAdd} style={{ height:40, border:'none', background:ACCENT, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:12, padding:'0 16px', fontSize:14, fontFamily:'inherit' }}>
                    Aggiungi spesa <IconPlus />
                  </button>
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:1, background:'#e0e0e0', marginBottom:1 }}>
                <KpiCard label={`Totale di ${ms[monthIndex]}`} value={fmt(monthTotal)} sub={<span style={{ color: up ? '#da1e28' : '#0e6027', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>{up ? <IconArrowUp /> : <IconArrowDown />}<span style={{ fontWeight:500 }}>{(up ? '+ ' : '− ') + fmt(Math.abs(delta)).replace('€ ', '') + ' (' + (up ? '+' : '−') + Math.abs(deltaPct) + '%)'}</span><span style={{ color:'#6f6f6f' }}>vs {ms[(monthIndex + 11) % 12]}</span></span>} flex="2 1 320px" minWidth={280} />
                <KpiCard label="Pagamenti attivi" value={String(activeCount)} sub={`${chargingCount} addebitati a ${ms[monthIndex]}`} flex="1 1 180px" minWidth={160} />
                <KpiCard label="Prossimo addebito" value={nx ? nx.e.name : '—'} valueSz={16} valueFw={600} sub={nx ? <span style={{ display:'flex', gap:8, alignItems:'baseline' }}><span style={{ color:'#6f6f6f', fontSize:13 }}>{shortDate(nx!.d)}</span><span style={{ fontWeight:500 }}>{fmt(getAmountForYM(nx!.e, nx!.d.getFullYear() * 12 + nx!.d.getMonth(), prices))}</span></span> : ''} flex="1 1 200px" minWidth={180} />
                <KpiCard label="Media mensile 2026" value={fmt(avg)} valueSz={32} valueFw={300} sub={`${fmt0(yearTotal)} nell'anno`} flex="1 1 180px" minWidth={160} />
              </div>

              {/* charts row */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginTop:16 }}>
                {/* TREND */}
                <section style={{ flex:'2 1 460px', background:'#fff', minWidth:340, display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, padding:'16px 24px 0' }}>
                    <div>
                      <div style={{ fontSize:16, fontWeight:600 }}>Andamento mensile</div>
                      <div style={{ fontSize:12, color:'#6f6f6f' }}>Totale addebitato per mese · {Y}</div>
                    </div>
                    <div style={{ display:'flex', border:'1px solid #e0e0e0' }}>
                      <button onClick={() => setTrendMode('total')} style={{ height:32, padding:'0 14px', border:'none', cursor:'pointer', fontSize:13, background: trendMode === 'total' ? '#161616' : '#fff', color: trendMode === 'total' ? '#fff' : '#161616', fontFamily:'inherit' }}>Totale</button>
                      <button onClick={() => setTrendMode('category')} style={{ height:32, padding:'0 14px', border:'none', borderLeft:'1px solid #e0e0e0', cursor:'pointer', fontSize:13, background: trendMode === 'category' ? '#161616' : '#fff', color: trendMode === 'category' ? '#fff' : '#161616', fontFamily:'inherit' }}>Per categoria</button>
                    </div>
                  </div>
                  <div style={{ position:'relative', padding:'24px 24px 8px 56px' }}>
                    <div style={{ position:'absolute', left:56, right:24, top:24, bottom:32, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                      {gridLines.map((g, i) => (
                        <div key={i} style={{ borderTop:'1px solid #f4f4f4', position:'relative' }}>
                          <span style={{ position:'absolute', left:-2, top:-8, transform:'translateX(-100%)', fontSize:10, color:'#a8a8a8', fontFamily:'var(--font-ibm-plex-mono), monospace', paddingRight:6 }}>{g.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ position:'relative', height:H }}>
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', overflow:'visible' }}>
                        {lines.map((ln, i) => <polyline key={i} points={ln.points} fill="none" stroke={ln.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />)}
                      </svg>
                      {dots.map((d, i) => (
                        <div key={i} style={{ position:'absolute', left:`${d.left}%`, bottom:`${d.bottom}px`, width:7, height:7, borderRadius:'50%', background:d.color, boxShadow:'0 0 0 2px #fff', transform:'translate(-50%,50%)' }} />
                      ))}
                      <div style={{ position:'absolute', inset:0, display:'flex', gap:6 }}>
                        {totals.map((t, i) => (
                          <div key={i} onMouseEnter={() => setHoverBar(i)} onMouseLeave={() => setHoverBar(-1)} onClick={() => setMonthIndex(i)} style={{ flex:1, height:'100%', cursor:'pointer' }} />
                        ))}
                      </div>
                      {hoverBar >= 0 && (
                        <div style={{ position:'absolute', left:`${(hoverBar + 0.5) / 12 * 100}%`, bottom:Math.min(H - 8, totals[hoverBar] / maxTot * H + 44), transform:'translate(-50%,0)', background:'#161616', color:'#fff', padding:'8px 12px', fontSize:12, whiteSpace:'nowrap', pointerEvents:'none', zIndex:5, boxShadow:'0 2px 6px rgba(0,0,0,.3)' }}>
                          <div style={{ fontWeight:600, marginBottom:2 }}>{MONTHS[hoverBar]} {Y}</div>
                          <div style={{ fontFamily:'var(--font-ibm-plex-mono), monospace' }}>{fmt(totals[hoverBar])}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:6, marginTop:8 }}>
                      {totals.map((_, i) => (
                        <div key={i} style={{ flex:1, textAlign:'center', fontSize:11, color: i === monthIndex ? '#161616' : '#8d8d8d', fontWeight: i === monthIndex ? 600 : 400 }}>{ms[i]}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:16, padding:'8px 24px 20px' }}>
                    {categories.map(c => (
                      <div key={c.key} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#525252', whiteSpace:'nowrap' }}>
                        <span style={{ width:10, height:10, background:c.color }} />{c.label}
                      </div>
                    ))}
                  </div>
                </section>

                {/* BREAKDOWN */}
                <section style={{ flex:'1 1 300px', background:'#fff', minWidth:280, padding:'16px 24px 20px' }}>
                  <div style={{ fontSize:16, fontWeight:600 }}>Spesa per categoria</div>
                  <div style={{ fontSize:12, color:'#6f6f6f', marginBottom:20 }}>{MONTHS[monthIndex]} {Y}</div>
                  <div style={{ display:'flex', height:12, width:'100%', marginBottom:20, overflow:'hidden' }}>
                    {breakdown.map((s, i) => <div key={i} style={{ width:`${s.pct}%`, background:s.color }} />)}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {breakdown.map((s, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f4f4f4' }}>
                        <span style={{ width:10, height:10, background:s.color, flex:'none' }} />
                        <span style={{ flex:1, fontSize:14 }}>{s.label}</span>
                        <span style={{ fontSize:12, color:'#6f6f6f', fontFamily:'var(--font-ibm-plex-mono), monospace', minWidth:38, textAlign:'right' }}>{s.pctLabel}</span>
                        <span style={{ fontSize:14, fontWeight:500, minWidth:90, textAlign:'right' }}>{s.amount}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* upcoming + table */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginTop:16 }}>
                {/* UPCOMING */}
                <section style={{ flex:'1 1 300px', background:'#fff', minWidth:280, padding:'16px 0 8px' }}>
                  <div style={{ padding:'0 24px 12px', fontSize:16, fontWeight:600 }}>Prossimi addebiti</div>
                  {upcoming.map((u, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 24px', borderTop:'1px solid #f4f4f4' }}>
                      <div style={{ flex:'none', width:44, textAlign:'center' }}>
                        <div style={{ fontSize:18, fontWeight:600, lineHeight:1 }}>{u.day}</div>
                        <div style={{ fontSize:11, color:'#6f6f6f', textTransform:'uppercase' }}>{u.mon}</div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.name}</div>
                        <span style={{ display:'inline-block', marginTop:4, fontSize:11, padding:'1px 8px', borderRadius:12, whiteSpace:'nowrap', background:u.tagBg, color:u.tagText }}>{u.catLabel}</span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:500, fontFamily:'var(--font-ibm-plex-mono), monospace' }}>{u.amount}</div>
                    </div>
                  ))}
                </section>

                {/* TABLE */}
                <section style={{ flex:'2 1 520px', background:'#fff', minWidth:340, display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, padding:'16px 24px' }}>
                    <div style={{ fontSize:16, fontWeight:600 }}>Tutte le spese ricorrenti</div>
                    <div style={{ fontSize:12, color:'#6f6f6f' }}>{rows.length} voci</div>
                  </div>
                  <FilterTabs tabs={filterTabs} onFilter={setFilter} />
                  <ExpenseTableHeader onSort={doSort} sortKey={sortKey} sortDir={sortDir} showInizio showFine />
                  <div>
                    {rows.map(r => (
                      <div key={r.id} onClick={() => { setSelectedId(r.id); setBackTo('overview'); setScreen('detail') }} style={{ display:'flex', alignItems:'center', minHeight:rowH, borderBottom:'1px solid #f4f4f4', fontSize:14, padding:'0 16px', cursor:'pointer' }}>
                        <RowContent r={r} onEdit={e => openEditFor(e)} showInizio showFine />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ── SPESE (LIST) ── */}
          {screen === 'list' && (
            <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 32px 64px' }}>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:12, letterSpacing:'0.32px', color:'#6f6f6f', textTransform:'uppercase', marginBottom:4 }}>Spese</div>
                  <h1 style={{ margin:0, fontSize:28, fontWeight:400, lineHeight:1.25 }}>Spese di {MONTHS[monthIndex]} {Y}</h1>
                </div>
                <div style={{ display:'flex', alignItems:'stretch', gap:8 }}>
                  <MonthPicker monthIndex={monthIndex} onChange={setMonthIndex} />
                  <button onClick={openAdd} style={{ height:40, border:'none', background:ACCENT, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:12, padding:'0 16px', fontSize:14, fontFamily:'inherit' }}>
                    Aggiungi spesa <IconPlus />
                  </button>
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:1, background:'#e0e0e0', marginBottom:16 }}>
                <KpiCard label={`Totale di ${ms[monthIndex]}`} value={fmt(monthTotal)} sub={<span style={{ color: up ? '#da1e28' : '#0e6027', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>{up ? <IconArrowUp /> : <IconArrowDown />}<span style={{ fontWeight:500 }}>{(up ? '+ ' : '− ') + fmt(Math.abs(delta)).replace('€ ', '')}</span><span style={{ color:'#6f6f6f' }}>vs {ms[(monthIndex + 11) % 12]}</span></span>} flex="2 1 320px" minWidth={280} />
                <KpiCard label="Spese del mese" value={String(monthRows.length)} sub={`${activeCount} pagamenti attivi`} flex="1 1 180px" minWidth={160} />
                <KpiCard label="Prossimo addebito" value={nx ? nx.e.name : '—'} valueSz={16} valueFw={600} sub={nx ? <span style={{ display:'flex', gap:8, alignItems:'baseline' }}><span style={{ color:'#6f6f6f', fontSize:13 }}>{shortDate(nx!.d)}</span><span style={{ fontWeight:500 }}>{fmt(getAmountForYM(nx!.e, nx!.d.getFullYear() * 12 + nx!.d.getMonth(), prices))}</span></span> : ''} flex="1 1 200px" minWidth={180} />
              </div>
              <section style={{ background:'#fff', display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, padding:'16px 24px' }}>
                  <div style={{ fontSize:16, fontWeight:600 }}>Dettaglio spese · {MONTHS[monthIndex]} {Y}</div>
                  <div style={{ fontSize:12, color:'#6f6f6f' }}>{monthRows.length} voci</div>
                </div>
                <FilterTabs tabs={filterTabs} onFilter={setFilter} />
                <ExpenseTableHeader onSort={doSort} sortKey={sortKey} sortDir={sortDir} showMethod />
                <div>
                  {monthRows.map(r => (
                    <div key={r.id} onClick={() => { setSelectedId(r.id); setBackTo('list'); setScreen('detail') }} style={{ display:'flex', alignItems:'center', minHeight:rowH, borderBottom:'1px solid #f4f4f4', fontSize:14, padding:'0 16px', cursor:'pointer' }}>
                      <RowContent r={r} onEdit={e => openEditFor(e)} showMethod />
                    </div>
                  ))}
                  {monthRows.length === 0 && (
                    <div style={{ padding:'48px 24px', textAlign:'center', color:'#6f6f6f', fontSize:14 }}>Nessuna spesa addebitata in {MONTHS[monthIndex]} {Y}.</div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ── DETAIL ── */}
          {screen === 'detail' && detailExp && (() => {
            const e = detailExp
            const cm = catOf(C, e.cat)
            const nd = e.is_variable ? null : nextChargeOf(e)
            const total = chargesTotal(e), done = chargesDone(e)
            const hasProgress = total != null && !e.is_variable
            const currentAmt = nd ? getAmountForYM(e, nd.getFullYear() * 12 + nd.getMonth(), prices) : e.amount
            // media ultimi 3 mesi da expense_prices per le spese variabili
            const varPrices = e.is_variable ? prices.filter(p => p.expense_id === e.id).sort((a, b) => (b.valid_from_year * 12 + b.valid_from_month) - (a.valid_from_year * 12 + a.valid_from_month)).slice(0, 3) : []
            const varAvg = varPrices.length > 0 ? varPrices.reduce((s, p) => s + p.amount, 0) / varPrices.length : null
            const annual = e.is_variable ? (varAvg ?? 0) * 12 : currentAmt * (12 / e.interval)
            let dStatus = 'Attiva', dStatusBg = '#defbe6', dStatusText = '#0e6027'
            if (e.end_year) {
              const rem = eYM(e)! - todayYM()
              if (rem <= 3) { dStatus = 'In scadenza'; dStatusBg = '#fff8e1'; dStatusText = '#8a6a00' }
              else { dStatus = 'Termina ' + endLabel(e); dStatusBg = '#e0e0e0'; dStatusText = '#393939' }
            }
            const facts = e.is_variable ? [
              { label:'Ultimo importo', value: varPrices[0] ? fmt(varPrices[0].amount) : '—', sub:'registrato' },
              { label:'Media ultimi 3 mesi', value: varAvg ? fmt(varAvg) : '—', sub:'stimata' },
              { label:'Metodo', value:e.method, sub:'' },
              { label:'Data di inizio', value:monYear(e), sub:'' },
              { label:'Spesa annua', value: varAvg ? fmt0(annual) : '—', sub:'stimata' },
            ] : [
              { label:'Importo', value:fmt(currentAmt), sub:'per addebito' },
              { label:'Ricorrenza', value:RECUR[e.interval], sub:'' },
              { label:'Prossimo addebito', value: nd ? shortDate(nd) : '—', sub:'' },
              { label:'Metodo', value:e.method, sub:'' },
              { label:'Data di inizio', value:monYear(e), sub:'' },
              { label:'Data di fine', value:endLabel(e), sub: e.end_year ? '' : 'continuativo' },
              { label:'Spesa annua', value:fmt0(annual), sub:'stimata' },
            ]
            const dTotals = []; for (let i = 0; i < 12; i++) {
              const ym = Y * 12 + i
              if (e.is_variable || e.is_prestazione) {
                const p = prices.find(p => p.expense_id === e.id && p.valid_from_year * 12 + p.valid_from_month === ym)
                dTotals.push(p ? p.amount : 0)
              } else {
                dTotals.push(charges(e, ym) ? getAmountForYM(e, ym, prices) : 0)
              }
            }
            const dMax = Math.max(...dTotals, 1)
            const dBars = dTotals.map((v, i) => ({ label: ms[i].charAt(0), h: v / dMax * 80, color: v > 0 ? cm.color : '#e0e0e0' }))
            const dYearTotal = fmt(dTotals.reduce((a, b) => a + b, 0))
            const hist: { d: Date; ym: number }[] = []
            const lastYM = eYM(e) != null ? Math.min(eYM(e)!, todayYM() + 6) : todayYM() + 6
            for (let ym = sYM(e); ym <= lastYM; ym++) { if (charges(e, ym)) hist.push({ d: chargeDate(e, ym), ym }) }
            const allPaid = hist.filter(h => h.d <= today)
            const allFuture = hist.filter(h => h.d > today)
            const paidSum = allPaid.reduce((a, h) => a + getAmountForYM(e, h.ym, prices), 0)
            const remainSum = allFuture.reduce((a, h) => a + getAmountForYM(e, h.ym, prices), 0)
            const past = allPaid.slice(-5)
            const future = allFuture.slice(0, 3)
            const history = [...past, ...future].reverse().map(h => {
              const paid = h.d <= today
              const hAmt = getAmountForYM(e, h.ym, prices)
              return { dateStr: h.d.toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric' }), statusLabel: paid ? ('Pagato · ' + e.method) : 'Programmato', amount: fmt(hAmt), amtColor: paid ? '#161616' : '#8d8d8d', dotBg: paid ? '#defbe6' : '#e0e0e0', dotColor: paid ? '#0e6027' : '#8d8d8d', paid }
            })
            return (
              <div style={{ maxWidth:1000, margin:'0 auto', padding:'20px 32px 64px' }}>
                <button onClick={() => setScreen(backTo)} style={{ display:'flex', alignItems:'center', gap:6, border:'none', background:'transparent', color:ACCENT, cursor:'pointer', fontSize:14, padding:'8px 0', marginBottom:8, fontFamily:'inherit' }}>
                  <IconChevLeft /> {backTo === 'list' ? 'Spese' : 'Panoramica'}
                </button>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
                  <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                    <span style={{ width:14, height:14, marginTop:10, flex:'none', background:cm.color }} />
                    <div>
                      <h1 style={{ margin:0, fontSize:28, fontWeight:400, lineHeight:1.2 }}>{e.name}</h1>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
                        <span style={{ fontSize:12, padding:'2px 10px', borderRadius:12, background:cm.tag_bg, color:cm.tag_text }}>{cm.label}</span>
                        <span style={{ fontSize:12, padding:'2px 10px', borderRadius:12, background:dStatusBg, color:dStatusText }}>{dStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEditFor(e)} style={{ height:40, padding:'0 16px', border:'1px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontSize:14, fontFamily:'inherit' }}>
                      Modifica <IconEdit />
                    </button>
                    <button onClick={() => deleteExpense(e.id)} style={{ height:40, padding:'0 16px', border:'1px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontSize:14, color:'#da1e28', fontFamily:'inherit' }}>
                      Elimina <IconTrash />
                    </button>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:1, background:'#e0e0e0', marginBottom:16 }}>
                  {facts.map((f, i) => (
                    <div key={i} style={{ flex:'1 1 150px', background:'#fff', padding:'16px 20px', minWidth:130 }}>
                      <div style={{ fontSize:12, color:'#6f6f6f', marginBottom:6 }}>{f.label}</div>
                      <div style={{ fontSize:18, fontWeight:500 }}>{f.value}</div>
                      <div style={{ fontSize:12, color:'#6f6f6f', marginTop:2 }}>{f.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
                  {hasProgress && (
                    <section style={{ flex:'1 1 320px', background:'#fff', padding:'20px 24px', minWidth:280 }}>
                      <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Piano di rientro</div>
                      <div style={{ fontSize:13, color:'#6f6f6f', marginBottom:16 }}>Rata {done} di {total} · {RECUR[e.interval].toLowerCase()}</div>
                      <div style={{ height:8, background:'#e0e0e0', marginBottom:6 }}>
                        <div style={{ height:8, width:`${Math.round(done / total! * 100)}%`, background:cm.color }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6f6f6f', marginBottom:20 }}>
                        <span>{done} versate · {total! - done} rimanenti</span><span>{Math.round(done / total! * 100)}%</span>
                      </div>
                      <div style={{ display:'flex', gap:24 }}>
                        <div><div style={{ fontSize:12, color:'#6f6f6f' }}>Pagato finora</div><div style={{ fontSize:20, fontWeight:500 }}>{fmt(paidSum)}</div></div>
                        <div><div style={{ fontSize:12, color:'#6f6f6f' }}>Residuo</div><div style={{ fontSize:20, fontWeight:500 }}>{fmt(remainSum)}</div></div>
                      </div>
                    </section>
                  )}
                  <section style={{ flex:'1 1 320px', background:'#fff', padding:'20px 24px', minWidth:280 }}>
                    <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Questa spesa nel {Y}</div>
                    <div style={{ fontSize:13, color:'#6f6f6f', marginBottom:20 }}>{dYearTotal} totali nell&apos;anno</div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:90 }}>
                      {dBars.map((b, i) => (
                        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center', height:'100%' }}>
                          <div style={{ width:'100%', maxWidth:18, height:b.h, background:b.color }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:4, marginTop:6 }}>
                      {dBars.map((b, i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:9, color:'#a8a8a8' }}>{b.label}</div>)}
                    </div>
                  </section>
                </div>
                <section style={{ background:'#fff', marginTop:16, padding:'20px 0 8px' }}>
                  <div style={{ padding:'0 24px 8px', fontSize:16, fontWeight:600 }}>Storico pagamenti</div>
                  {history.map((h, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 24px', borderTop:'1px solid #f4f4f4' }}>
                      <span style={{ width:24, height:24, flex:'none', borderRadius:'50%', background:h.dotBg, color:h.dotColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {h.paid ? <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 11L3 7.5l.9-.9 2.6 2.6L12 3.8l.9.9z"/></svg> : <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="4"/></svg>}
                      </span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:500 }}>{h.dateStr}</div>
                        <div style={{ fontSize:12, color:'#6f6f6f' }}>{h.statusLabel}</div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:500, fontFamily:'var(--font-ibm-plex-mono), monospace', color:h.amtColor }}>{h.amount}</div>
                    </div>
                  ))}
                </section>
              </div>
            )
          })()}

          {/* ── CATEGORIE ── */}
          {screen === 'catg' && (
            <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 32px 64px' }}>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:12, letterSpacing:'0.32px', color:'#6f6f6f', textTransform:'uppercase', marginBottom:4 }}>Gestione</div>
                  <h1 style={{ margin:0, fontSize:28, fontWeight:400, lineHeight:1.25 }}>Categorie e tipi di pagamento</h1>
                </div>
                <MonthPicker monthIndex={monthIndex} onChange={setMonthIndex} />
              </div>

              {/* Categorie */}
              <section style={{ background:'#fff', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'16px 24px' }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                    <div style={{ fontSize:16, fontWeight:600 }}>Categorie</div>
                    <div style={{ fontSize:12, color:'#6f6f6f' }}>{categories.length} categorie</div>
                  </div>
                  <button onClick={() => setCatEditor({ open:true, mode:'add', id:'', key:'', label:'', color:CAT_PALETTE[0].color, tag_bg:CAT_PALETTE[0].tag_bg, tag_text:CAT_PALETTE[0].tag_text })} style={{ height:32, border:'1px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'0 12px', fontSize:13, fontFamily:'inherit' }}>
                    Aggiungi <IconPlus />
                  </button>
                </div>
                {categories.map(c => {
                  const inCat = expenses.filter(e => e.cat === c.key)
                  const monthTot = inCat.filter(e => charges(e, selYM)).reduce((a, e) => a + getAmountForYM(e, selYM, prices), 0)
                  const annual = inCat.reduce((a, e) => a + getAmountForYM(e, todayYM(), prices) * (12 / e.interval), 0)
                  const canDel = inCat.length === 0
                  return (
                    <div key={c.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 24px', borderTop:'1px solid #f4f4f4' }}>
                      <span style={{ width:14, height:14, flex:'none', background:c.color }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:500 }}>{c.label}</div>
                        <div style={{ fontSize:12, color:'#6f6f6f' }}>{inCat.length} {inCat.length === 1 ? 'spesa' : 'spese'}</div>
                      </div>
                      <div style={{ textAlign:'right', minWidth:120 }}>
                        <div style={{ fontSize:14, fontWeight:500, fontFamily:'var(--font-ibm-plex-mono), monospace' }}>{fmt(monthTot)}</div>
                        <div style={{ fontSize:12, color:'#6f6f6f' }}>{fmt0(annual)} / anno</div>
                      </div>
                      <div style={{ display:'flex', gap:2, flex:'none' }}>
                        <button onClick={() => setCatEditor({ open:true, mode:'edit', id:c.id, key:c.key, label:c.label, color:c.color, tag_bg:c.tag_bg, tag_text:c.tag_text })} style={{ width:32, height:32, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#525252' }}><IconEdit /></button>
                        <button onClick={() => deleteCat(c)} disabled={!canDel} title={canDel ? 'Elimina' : 'Categoria in uso'} style={{ width:32, height:32, border:'none', background:'transparent', cursor: canDel ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', color: canDel ? '#525252' : '#c6c6c6' }}><IconTrash /></button>
                      </div>
                    </div>
                  )
                })}
              </section>

              {/* Metodi */}
              <section style={{ background:'#fff' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'16px 24px' }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                    <div style={{ fontSize:16, fontWeight:600 }}>Tipi di pagamento</div>
                    <div style={{ fontSize:12, color:'#6f6f6f' }}>{methods.length} metodi</div>
                  </div>
                  <button onClick={() => setPayEditor({ open:true, mode:'add', id:'', label:'' })} style={{ height:32, border:'1px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'0 12px', fontSize:13, fontFamily:'inherit' }}>
                    Aggiungi <IconPlus />
                  </button>
                </div>
                {methods.map(m => {
                  const using = expenses.filter(e => e.method === m.label)
                  const monthTot = using.filter(e => charges(e, selYM)).reduce((a, e) => a + getAmountForYM(e, selYM, prices), 0)
                  const canDel = using.length === 0
                  return (
                    <div key={m.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 24px', borderTop:'1px solid #f4f4f4' }}>
                      <span style={{ width:32, height:32, flex:'none', borderRadius:'50%', background:'#f4f4f4', color:'#525252', display:'flex', alignItems:'center', justifyContent:'center' }}>{methodIcon(m.label)}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:500 }}>{m.label}</div>
                        <div style={{ fontSize:12, color:'#6f6f6f' }}>{using.length} {using.length === 1 ? 'spesa' : 'spese'}</div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:500, fontFamily:'var(--font-ibm-plex-mono), monospace', minWidth:96, textAlign:'right' }}>{fmt(monthTot)}</div>
                      <div style={{ display:'flex', gap:2, flex:'none' }}>
                        <button onClick={() => setPayEditor({ open:true, mode:'edit', id:m.id, label:m.label })} style={{ width:32, height:32, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#525252' }}><IconEdit /></button>
                        <button onClick={() => deletePay(m)} disabled={!canDel} title={canDel ? 'Elimina' : 'Tipo in uso'} style={{ width:32, height:32, border:'none', background:'transparent', cursor: canDel ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', color: canDel ? '#525252' : '#c6c6c6' }}><IconTrash /></button>
                      </div>
                    </div>
                  )
                })}
                <div style={{ padding:'14px 24px', borderTop:'1px solid #f4f4f4' }}>
                  <div style={{ fontSize:12, color:'#a8a8a8' }}>I tipi di pagamento disponibili nella maschera di inserimento spesa.</div>
                </div>
              </section>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL SPESA ── */}
      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(22,22,22,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:560, maxWidth:'calc(100vw - 32px)', maxHeight:'calc(100vh - 64px)', background:'#fff', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 24px 8px' }}>
              <div>
                <div style={{ fontSize:12, color:'#6f6f6f' }}>{modalMode === 'edit' ? 'Modifica' : 'Nuova voce'}</div>
                <h2 style={{ margin:'4px 0 0', fontSize:20, fontWeight:400 }}>{modalMode === 'edit' ? 'Modifica spesa ricorrente' : 'Aggiungi spesa ricorrente'}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ width:40, height:40, border:'none', background:'transparent', cursor:'pointer', color:'#161616', display:'flex', alignItems:'center', justifyContent:'center' }}><IconClose /></button>
            </div>
            <div style={{ padding:'8px 24px 24px', overflow:'auto' }}>
              <FormField label="Nome della spesa">
                <input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} placeholder="es. Netflix, Mutuo casa…" style={inputStyle} />
              </FormField>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:16 }}>
                <FormField label="Categoria" flex="1 1 180px">
                  <select value={form.cat} onChange={e => { const cat = e.target.value; setForm(s => ({ ...s, cat, isPrestazione: cat === 'prestazione', isVariable: cat === 'bollette' ? s.isVariable : false })) }} style={inputStyle}>
                    {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Importo (€)" flex="1 1 140px">
                  <input value={form.amount} onChange={e => setForm(s => ({ ...s, amount: e.target.value }))} inputMode="decimal" placeholder="0,00" style={{ ...inputStyle, fontFamily:'var(--font-ibm-plex-mono), monospace' }} />
                </FormField>
              </div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:16 }}>
                <FormField label="Ricorrenza" flex="1 1 180px">
                  <select value={form.interval} onChange={e => setForm(s => ({ ...s, interval: e.target.value }))} style={inputStyle}>
                    <option value="1">Mensile</option>
                    <option value="2">Bimestrale</option>
                    <option value="3">Trimestrale</option>
                    <option value="6">Semestrale</option>
                    <option value="12">Annuale</option>
                  </select>
                </FormField>
                <FormField label="Metodo di pagamento" flex="1 1 140px">
                  <select value={form.method} onChange={e => setForm(s => ({ ...s, method: e.target.value }))} style={inputStyle}>
                    {methods.map(m => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </FormField>
              </div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:8 }}>
                <FormField label="Data di inizio" flex="1 1 180px">
                  <input type="date" value={form.start} onChange={e => setForm(s => ({ ...s, start: e.target.value }))} style={inputStyle} />
                </FormField>
                <FormField label="Data di fine" flex="1 1 180px">
                  <input type="date" value={form.end} onChange={e => setForm(s => ({ ...s, end: e.target.value }))} disabled={form.hasEnd} style={{ ...inputStyle, background: form.hasEnd ? '#e8e8e8' : '#f4f4f4' }} />
                </FormField>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'8px 0 4px' }}>
                <span onClick={() => setForm(s => ({ ...s, hasEnd: !s.hasEnd }))} style={{ width:32, height:16, borderRadius:8, background: form.hasEnd ? ACCENT : '#8d8d8d', position:'relative', transition:'background .15s', flex:'none', cursor:'pointer' }}>
                  <span style={{ position:'absolute', top:2, left: form.hasEnd ? 18 : 2, width:12, height:12, borderRadius:'50%', background:'#fff', transition:'left .15s' }} />
                </span>
                <span style={{ fontSize:13, color:'#525252' }}>Senza data di fine (pagamento continuativo)</span>
              </label>
              <FormField label="Note (facoltative)" style={{ marginTop:16 }}>
                <textarea value={form.note} onChange={e => setForm(s => ({ ...s, note: e.target.value }))} rows={2} placeholder="Aggiungi un dettaglio…" style={{ ...inputStyle, resize:'vertical', height:'auto', padding:'8px 12px' }} />
              </FormField>

              {/* toggle importo variabile — solo per Bollette */}
              {form.cat === 'bollette' && (
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'16px 0 4px' }}>
                  <span onClick={() => setForm(s => ({ ...s, isVariable: !s.isVariable }))} style={{ width:32, height:16, borderRadius:8, background: form.isVariable ? ACCENT : '#8d8d8d', position:'relative', transition:'background .15s', flex:'none', cursor:'pointer' }}>
                    <span style={{ position:'absolute', top:2, left: form.isVariable ? 18 : 2, width:12, height:12, borderRadius:'50%', background:'#fff', transition:'left .15s' }} />
                  </span>
                  <span style={{ fontSize:13, color:'#525252' }}>Importo variabile (es. luce, gas, pedaggi…)</span>
                </label>
              )}

              {/* sezione registrazione/cambio importo */}
              <div style={{ marginTop:16, padding:'16px', background:'#f4f4f4', borderLeft:'3px solid ' + ACCENT }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#525252', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.32px' }}>
                  {(form.isVariable || form.isPrestazione) ? 'Registra importo per un mese' : (modalMode === 'edit' ? 'Cambia importo (opzionale)' : 'Importo iniziale storico (opzionale)')}
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <FormField label={form.isPrestazione ? 'Importo per seduta (€)' : (form.isVariable ? 'Importo (€)' : 'Nuovo importo (€)')} flex="1 1 130px" style={{ marginBottom:0 }}>
                    <input value={form.priceNewAmt} onChange={e => setForm(s => ({ ...s, priceNewAmt: e.target.value }))} inputMode="decimal" placeholder="0,00" style={{ ...inputStyle, fontFamily:'var(--font-ibm-plex-mono), monospace' }} />
                  </FormField>
                  {form.isPrestazione && (
                    <FormField label="N. sedute" flex="0 0 90px" style={{ marginBottom:0 }}>
                      <input value={form.priceQty} onChange={e => setForm(s => ({ ...s, priceQty: e.target.value }))} inputMode="numeric" placeholder="1" style={{ ...inputStyle, fontFamily:'var(--font-ibm-plex-mono), monospace' }} />
                    </FormField>
                  )}
                  <FormField label={(form.isVariable || form.isPrestazione) ? 'Mese di riferimento' : 'A partire da'} flex="1 1 150px" style={{ marginBottom:0 }}>
                    <input type="month" value={form.priceFrom} onChange={e => setForm(s => ({ ...s, priceFrom: e.target.value }))} style={inputStyle} />
                  </FormField>
                </div>
                {form.isPrestazione && form.priceNewAmt && form.priceQty && (
                  <div style={{ fontSize:12, color:ACCENT, marginTop:8, fontFamily:'var(--font-ibm-plex-mono), monospace' }}>
                    Totale: {(() => { const a = parseFloat(String(form.priceNewAmt).replace(',','.')); const q = parseInt(form.priceQty)||1; return isNaN(a) ? '—' : '€ '+(a*q).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}) })()}
                  </div>
                )}
                <div style={{ fontSize:11, color:'#8d8d8d', marginTop:8 }}>
                  {(form.isVariable || form.isPrestazione)
                    ? 'Verrà registrato solo per quel mese. Lascia vuoto per non registrare nulla ora.'
                    : 'Il vecchio importo verrà chiuso il mese precedente. Lascia vuoto per non modificare lo storico.'}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', flex:'none' }}>
              <button onClick={() => setModalOpen(false)} style={{ flex:1, height:64, border:'none', background:'#fff', color:'#161616', cursor:'pointer', fontSize:14, textAlign:'left', padding:'0 16px', fontFamily:'inherit' }}>Annulla</button>
              <button onClick={saveExpense} disabled={saving} style={{ flex:1, height:64, border:'none', background:ACCENT, color:'#fff', cursor:'pointer', fontSize:14, textAlign:'left', padding:'0 16px', fontFamily:'inherit' }}>
                {saving ? 'Salvataggio…' : modalMode === 'edit' ? 'Salva modifiche' : 'Aggiungi spesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CATEGORIA ── */}
      {catEditor.open && (
        <div onClick={() => setCatEditor(s => ({ ...s, open: false }))} style={{ position:'fixed', inset:0, background:'rgba(22,22,22,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:460, maxWidth:'calc(100vw - 32px)', background:'#fff', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 24px 8px' }}>
              <div>
                <div style={{ fontSize:12, color:'#6f6f6f' }}>{catEditor.mode === 'edit' ? 'Modifica' : 'Nuova'}</div>
                <h2 style={{ margin:'4px 0 0', fontSize:20, fontWeight:400 }}>{catEditor.mode === 'edit' ? 'Modifica categoria' : 'Aggiungi categoria'}</h2>
              </div>
              <button onClick={() => setCatEditor(s => ({ ...s, open: false }))} style={{ width:40, height:40, border:'none', background:'transparent', cursor:'pointer', color:'#161616', display:'flex', alignItems:'center', justifyContent:'center' }}><IconClose /></button>
            </div>
            <div style={{ padding:'8px 24px 24px' }}>
              <FormField label="Nome categoria" style={{ marginBottom:20 }}>
                <input value={catEditor.label} onChange={e => setCatEditor(s => ({ ...s, label: e.target.value }))} placeholder="es. Trasporti, Salute…" style={inputStyle} />
              </FormField>
              <div style={{ fontSize:12, color:'#525252', marginBottom:10 }}>Colore</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
                {CAT_PALETTE.map((p, i) => (
                  <button key={i} onClick={() => setCatEditor(s => ({ ...s, color: p.color, tag_bg: p.tag_bg, tag_text: p.tag_text }))} style={{ width:30, height:30, border:`2px solid ${catEditor.color === p.color ? '#161616' : '#e0e0e0'}`, background:p.color, cursor:'pointer', padding:0, borderRadius:'50%' }} />
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, color:'#525252' }}>Anteprima</span>
                <span style={{ fontSize:12, padding:'2px 10px', borderRadius:12, background:catEditor.tag_bg, color:catEditor.tag_text }}>{catEditor.label || 'Nuova categoria'}</span>
              </div>
            </div>
            <div style={{ display:'flex', flex:'none' }}>
              <button onClick={() => setCatEditor(s => ({ ...s, open: false }))} style={{ flex:1, height:64, border:'none', background:'#fff', color:'#161616', cursor:'pointer', fontSize:14, textAlign:'left', padding:'0 16px', fontFamily:'inherit' }}>Annulla</button>
              <button onClick={saveCat} style={{ flex:1, height:64, border:'none', background:ACCENT, color:'#fff', cursor:'pointer', fontSize:14, textAlign:'left', padding:'0 16px', fontFamily:'inherit' }}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL METODO ── */}
      {payEditor.open && (
        <div onClick={() => setPayEditor(s => ({ ...s, open: false }))} style={{ position:'fixed', inset:0, background:'rgba(22,22,22,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:460, maxWidth:'calc(100vw - 32px)', background:'#fff', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 24px 8px' }}>
              <div>
                <div style={{ fontSize:12, color:'#6f6f6f' }}>{payEditor.mode === 'edit' ? 'Modifica' : 'Nuovo'}</div>
                <h2 style={{ margin:'4px 0 0', fontSize:20, fontWeight:400 }}>{payEditor.mode === 'edit' ? 'Modifica tipo di pagamento' : 'Aggiungi tipo di pagamento'}</h2>
              </div>
              <button onClick={() => setPayEditor(s => ({ ...s, open: false }))} style={{ width:40, height:40, border:'none', background:'transparent', cursor:'pointer', color:'#161616', display:'flex', alignItems:'center', justifyContent:'center' }}><IconClose /></button>
            </div>
            <div style={{ padding:'8px 24px 24px' }}>
              <FormField label="Nome tipo di pagamento">
                <input value={payEditor.label} onChange={e => setPayEditor(s => ({ ...s, label: e.target.value }))} placeholder="es. Carta •• 1234, Satispay…" style={inputStyle} />
              </FormField>
            </div>
            <div style={{ display:'flex', flex:'none' }}>
              <button onClick={() => setPayEditor(s => ({ ...s, open: false }))} style={{ flex:1, height:64, border:'none', background:'#fff', color:'#161616', cursor:'pointer', fontSize:14, textAlign:'left', padding:'0 16px', fontFamily:'inherit' }}>Annulla</button>
              <button onClick={savePay} style={{ flex:1, height:64, border:'none', background:ACCENT, color:'#fff', cursor:'pointer', fontSize:14, textAlign:'left', padding:'0 16px', fontFamily:'inherit' }}>Salva</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function MonthPicker({ monthIndex, onChange }: { monthIndex: number; onChange: (i: number) => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', border:'1px solid #e0e0e0', background:'#fff', height:40 }}>
      <button onClick={() => onChange(Math.max(0, monthIndex - 1))} style={{ width:40, height:40, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#161616' }}><IconChevLeft /></button>
      <div style={{ minWidth:128, textAlign:'center', fontSize:14, fontWeight:500 }}>{MONTHS[monthIndex]} {new Date().getFullYear()}</div>
      <button onClick={() => onChange(Math.min(11, monthIndex + 1))} style={{ width:40, height:40, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#161616' }}><IconChevRight /></button>
    </div>
  )
}

function KpiCard({ label, value, sub, flex, minWidth, valueSz = 42, valueFw = 300 }: { label: string; value: string; sub?: React.ReactNode; flex: string; minWidth: number; valueSz?: number; valueFw?: number }) {
  return (
    <div style={{ flex, background:'#fff', padding:'20px 24px', minWidth }}>
      <div style={{ fontSize:12, color:'#6f6f6f', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:valueSz, fontWeight:valueFw, lineHeight:1.1, letterSpacing:'-0.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</div>
      {sub && <div style={{ marginTop:8 }}>{sub}</div>}
    </div>
  )
}

function FilterTabs({ tabs, onFilter }: { tabs: { label: string; k: string; color: string; weight: number; bar: string }[]; onFilter: (k: string) => void }) {
  return (
    <div style={{ display:'flex', padding:'0 16px', borderBottom:'1px solid #e0e0e0', overflowX:'auto' }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => onFilter(t.k)} style={{ height:40, padding:'0 12px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, whiteSpace:'nowrap', color:t.color, fontWeight:t.weight, borderBottom:`2px solid ${t.bar}`, fontFamily:'inherit' }}>{t.label}</button>
      ))}
    </div>
  )
}

function ExpenseTableHeader({ onSort, sortKey, sortDir, showInizio, showFine, showMethod }: { onSort: (k: 'name'|'amount'|'next') => void; sortKey: string; sortDir: string; showInizio?: boolean; showFine?: boolean; showMethod?: boolean }) {
  const icon = (k: string) => { if (sortKey !== k) return null; return sortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown /> }
  return (
    <div style={{ display:'flex', alignItems:'center', height:40, background:'#f4f4f4', borderBottom:'1px solid #e0e0e0', fontSize:12, fontWeight:600, color:'#161616', padding:'0 16px' }}>
      <button onClick={() => onSort('name')} style={{ flex:2.4, minWidth:120, textAlign:'left', border:'none', background:'transparent', cursor:'pointer', font:'inherit', fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>Nome {icon('name')}</button>
      <div style={{ flex:1.3, minWidth:96 }}>Categoria</div>
      <button onClick={() => onSort('amount')} style={{ flex:1, minWidth:84, textAlign:'right', justifyContent:'flex-end', border:'none', background:'transparent', cursor:'pointer', font:'inherit', fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>Importo {icon('amount')}</button>
      <div style={{ flex:1.1, minWidth:92, paddingLeft:16 }}>Ricorrenza</div>
      {showInizio && <div style={{ flex:1, minWidth:80 }}>Inizio</div>}
      {showFine && <div style={{ flex:1, minWidth:80 }}>Fine</div>}
      {showMethod && <div style={{ flex:1, minWidth:80 }}>Metodo</div>}
      <button onClick={() => onSort('next')} style={{ flex:1.1, minWidth:96, textAlign:'right', justifyContent:'flex-end', border:'none', background:'transparent', cursor:'pointer', font:'inherit', fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>Prossimo {icon('next')}</button>
      <div style={{ width:40, textAlign:'center' }}>Edit</div>
    </div>
  )
}

function RowContent({ r, onEdit, showInizio, showFine, showMethod }: { r: ReturnType<typeof buildMapRow>; onEdit: (e: Expense) => void; showInizio?: boolean; showFine?: boolean; showMethod?: boolean }) {
  return (
    <>
      <div style={{ flex:2.4, minWidth:120, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ width:8, height:8, flex:'none', background:r.color }} />
        <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:500 }}>{r.name}</span>
      </div>
      <div style={{ flex:1.3, minWidth:96 }}>
        <span style={{ fontSize:11, padding:'1px 8px', borderRadius:12, whiteSpace:'nowrap', background:r.tagBg, color:r.tagText }}>{r.catLabel}</span>
      </div>
      <div style={{ flex:1, minWidth:84, textAlign:'right', fontFamily:'var(--font-ibm-plex-mono), monospace' }}>{r.importo}</div>
      <div style={{ flex:1.1, minWidth:92, paddingLeft:16, color:'#525252' }}>{r.recur}</div>
      {showInizio && <div style={{ flex:1, minWidth:80, color:'#525252' }}>{r.inizio}</div>}
      {showFine && <div style={{ flex:1, minWidth:80, color:'#525252' }}>{r.fine}</div>}
      {showMethod && <div style={{ flex:1, minWidth:80, color:'#525252', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.method}</div>}
      <div style={{ flex:1.1, minWidth:96, textAlign:'right', color:'#525252' }}>{r.prossimo}</div>
      <div style={{ width:40, display:'flex', justifyContent:'center' }}>
        <button onClick={ev => { ev.stopPropagation(); onEdit(r.e) }} title="Modifica" style={{ width:32, height:32, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#525252' }}><IconEdit /></button>
      </div>
    </>
  )
}

// helper type for RowContent
function buildMapRow(e: Expense, C: ReturnType<typeof buildCatMap>) {
  const nd = nextChargeOf(e); const cc = catOf(C, e.cat)
  return { id: e.id, name: e.name, color: cc.color, catLabel: cc.label, tagBg: cc.tag_bg, tagText: cc.tag_text, importo: fmt(e.amount), recur: RECUR[e.interval], inizio: monYear(e), fine: endLabel(e), method: e.method, prossimo: nd ? shortDate(nd) : '—', e }
}

function FormField({ label, children, flex, style }: { label: string; children: React.ReactNode; flex?: string; style?: React.CSSProperties }) {
  return (
    <label style={{ display:'block', flex, marginBottom:16, ...style }}>
      <span style={{ display:'block', fontSize:12, color:'#525252', marginBottom:6 }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width:'100%', height:40, border:'none', borderBottom:'1px solid #8d8d8d', background:'#f4f4f4',
  padding:'0 12px', fontSize:14, color:'#161616', boxSizing:'border-box', fontFamily:'inherit'
}
