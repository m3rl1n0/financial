import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : 'ME'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#f4f4f4', color:'#161616', fontSize:14 }}>
      <header style={{ flex:'none', height:48, background:'#161616', color:'#f4f4f4', display:'flex', alignItems:'center', borderBottom:'1px solid #393939' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, padding:'0 16px' }}>
          <span style={{ fontSize:16, fontWeight:600, letterSpacing:'0.01em' }}>Cadenza</span>
          <span style={{ fontSize:14, color:'#8d8d8d' }}>Spese ricorrenti</span>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'#393939', color:'#f4f4f4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600 }}>
            {initials}
          </div>
        </div>
      </header>
      <main style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'#6f6f6f' }}>
          <div style={{ fontSize:32, fontWeight:300, marginBottom:8 }}>Benvenuto</div>
          <div style={{ fontSize:14 }}>La dashboard è in costruzione — ci sei quasi!</div>
        </div>
      </main>
    </div>
  )
}
