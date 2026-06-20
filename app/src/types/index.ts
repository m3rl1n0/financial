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
  amount: number       // importo corrente (fallback se non ci sono price records)
  interval: 1 | 2 | 3 | 6 | 12
  start_year: number
  start_month: number  // 0-indexed
  end_year: number | null
  end_month: number | null  // 0-indexed
  day: number
  method: string
  note: string
  is_variable: boolean
  created_at: string
}

export interface ExpensePrice {
  id: string
  expense_id: string
  user_id: string
  amount: number
  valid_from_year: number
  valid_from_month: number   // 0-indexed
  valid_to_year: number | null
  valid_to_month: number | null  // 0-indexed
  created_at: string
}
