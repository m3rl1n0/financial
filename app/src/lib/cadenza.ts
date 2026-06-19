import type { Expense, Category } from '@/types'

export const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
export const MONTHS_SHORT = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic']
export const RECUR: Record<number, string> = {1:'Mensile',2:'Bimestrale',3:'Trimestrale',6:'Semestrale',12:'Annuale'}
export const ACCENT = '#0f62fe'
export const YEAR = 2026

export function sYM(e: Expense) { return e.start_year * 12 + e.start_month }
export function eYM(e: Expense) { return e.end_year != null ? e.end_year * 12 + e.end_month! : null }
export function todayYM() { return YEAR * 12 + 5 }
export function TODAY() { return new Date(2026, 5, 19) }

export function charges(e: Expense, ym: number) {
  const s = sYM(e), en = eYM(e)
  return ym >= s && (en == null || ym <= en) && (ym - s) % e.interval === 0
}

export function chargeDate(e: Expense, ym: number) {
  const y = Math.floor(ym / 12), m = ym % 12
  const dim = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(e.day, dim))
}

export function fmt(n: number) {
  return '€ ' + (Math.round(n * 100) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function fmt0(n: number) {
  return '€ ' + Math.round(n).toLocaleString('it-IT')
}
export function shortDate(d: Date) {
  return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()]
}
export function monYear(e: Expense) {
  return MONTHS_SHORT[e.start_month] + ' ' + e.start_year
}
export function endLabel(e: Expense) {
  return e.end_year != null ? MONTHS_SHORT[e.end_month!] + ' ' + e.end_year : '—'
}

export function nextChargeOf(e: Expense): Date | null {
  const today = TODAY()
  for (let k = 0; k < 60; k++) {
    const ym = todayYM() + k
    if (charges(e, ym)) {
      const d = chargeDate(e, ym)
      if (d >= today) return d
    }
  }
  return null
}

export function chargesTotal(e: Expense): number | null {
  const s = sYM(e), en = eYM(e)
  if (en == null) return null
  return Math.floor((en - s) / e.interval) + 1
}

export function chargesDone(e: Expense): number {
  const today = TODAY()
  const s = sYM(e), en = eYM(e)
  let c = 0
  const last = en != null ? en : todayYM()
  for (let ym = s; ym <= Math.max(last, todayYM()); ym++) {
    if (charges(e, ym)) {
      const d = chargeDate(e, ym)
      if (d <= today) c++
    }
  }
  return c
}

export function totalForYM(ym: number, list: Expense[]) {
  let t = 0; list.forEach(e => { if (charges(e, ym)) t += e.amount }); return t
}
export function catTotalForYM(cat: string, ym: number, list: Expense[]) {
  let t = 0; list.forEach(e => { if (e.cat === cat && charges(e, ym)) t += e.amount }); return t
}

export type CatMap = Record<string, Category>
export function buildCatMap(cats: Category[]): CatMap {
  const m: CatMap = {}
  cats.forEach(c => { m[c.key] = c })
  return m
}
export function catOf(C: CatMap, k: string): Category {
  return C[k] || { id:'', user_id:'', key:k, label:'—', color:'#8d8d8d', tag_bg:'#e0e0e0', tag_text:'#525252', created_at:'' }
}

export const CAT_PALETTE = [
  { color:'#0f62fe', tag_bg:'#d0e2ff', tag_text:'#0043ce' },
  { color:'#8a3ffc', tag_bg:'#e8daff', tag_text:'#6929c4' },
  { color:'#007d79', tag_bg:'#9ef0f0', tag_text:'#005d5d' },
  { color:'#198038', tag_bg:'#a7f0ba', tag_text:'#0e6027' },
  { color:'#da1e28', tag_bg:'#ffd7d9', tag_text:'#a2191f' },
  { color:'#ff832b', tag_bg:'#ffe2cc', tag_text:'#8a3800' },
  { color:'#d02670', tag_bg:'#ffd6e8', tag_text:'#9f1853' },
  { color:'#1192e8', tag_bg:'#c6e6ff', tag_text:'#00539a' },
]
