import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CadenzaApp from './CadenzaApp'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: expenses }, { data: categories }, { data: methods }] = await Promise.all([
    supabase.from('expenses').select('*').order('created_at'),
    supabase.from('categories').select('*').order('created_at'),
    supabase.from('payment_methods').select('*').order('created_at'),
  ])

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : 'ME'

  return (
    <CadenzaApp
      initialExpenses={expenses ?? []}
      initialCategories={categories ?? []}
      initialMethods={methods ?? []}
      userInitials={initials}
      userId={user.id}
    />
  )
}
