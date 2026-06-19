export interface Category {
  id: string
  user_id: string
  key: string
  label: string
  color: string
  tag_bg: string
  tag_text: string
  created_at: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  label: string
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  name: string
  cat: string
  amount: number
  interval: 1 | 2 | 3 | 6 | 12
  start_year: number
  start_month: number  // 0-indexed
  end_year: number | null
  end_month: number | null  // 0-indexed
  day: number
  method: string
  note: string
  created_at: string
}
