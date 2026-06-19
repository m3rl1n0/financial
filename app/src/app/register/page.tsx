'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Le password non coincidono.'); return }
    if (password.length < 6) { setError('La password deve essere di almeno 6 caratteri.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#f4f4f4', fontFamily:"'IBM Plex Sans', system-ui, sans-serif" }}>
      <header style={{ height:48, background:'#161616', color:'#f4f4f4', display:'flex', alignItems:'center', padding:'0 16px' }}>
        <span style={{ fontSize:16, fontWeight:600, letterSpacing:'0.01em' }}>Cadenza</span>
        <span style={{ fontSize:14, color:'#8d8d8d', marginLeft:8 }}>Spese ricorrenti</span>
      </header>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'100%', maxWidth:400, background:'#fff' }}>
          <div style={{ padding:'32px 32px 0' }}>
            <div style={{ fontSize:12, color:'#6f6f6f', letterSpacing:'0.32px', textTransform:'uppercase', marginBottom:4 }}>Registrazione</div>
            <h1 style={{ margin:'0 0 24px', fontSize:24, fontWeight:400 }}>Crea il tuo account</h1>
          </div>
          <form onSubmit={handleSubmit} style={{ padding:'0 32px 32px', display:'flex', flexDirection:'column', gap:16 }}>
            <label style={{ display:'block' }}>
              <span style={{ display:'block', fontSize:12, color:'#525252', marginBottom:6 }}>Email</span>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width:'100%', height:40, border:'none', borderBottom:'1px solid #8d8d8d', background:'#f4f4f4', padding:'0 12px', fontSize:14, color:'#161616', boxSizing:'border-box' }}
              />
            </label>
            <label style={{ display:'block' }}>
              <span style={{ display:'block', fontSize:12, color:'#525252', marginBottom:6 }}>Password</span>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width:'100%', height:40, border:'none', borderBottom:'1px solid #8d8d8d', background:'#f4f4f4', padding:'0 12px', fontSize:14, color:'#161616', boxSizing:'border-box' }}
              />
            </label>
            <label style={{ display:'block' }}>
              <span style={{ display:'block', fontSize:12, color:'#525252', marginBottom:6 }}>Conferma password</span>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                style={{ width:'100%', height:40, border:'none', borderBottom:'1px solid #8d8d8d', background:'#f4f4f4', padding:'0 12px', fontSize:14, color:'#161616', boxSizing:'border-box' }}
              />
            </label>
            {error && <div style={{ fontSize:13, color:'#da1e28' }}>{error}</div>}
            <button
              type="submit" disabled={loading}
              style={{ height:48, border:'none', background:'#0f62fe', color:'#fff', cursor:'pointer', fontSize:14, fontFamily:'inherit', marginTop:8 }}
            >
              {loading ? 'Registrazione…' : 'Crea account'}
            </button>
            <div style={{ fontSize:13, color:'#525252', textAlign:'center' }}>
              Hai già un account?{' '}
              <Link href="/login" style={{ color:'#0f62fe' }}>Accedi</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
