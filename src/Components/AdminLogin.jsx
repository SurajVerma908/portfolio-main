/* eslint-disable react/prop-types */
import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn } from 'lucide-react'

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [username, setUsername] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, remember }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Login failed')
      onLogin(data, remember)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-shell"><div className="login-card"><a className="admin-back" href="/"><ArrowLeft size={16} /> Back to portfolio</a><div className="login-icon"><LockKeyhole size={23} /></div><p className="eyebrow">PRIVATE CONTENT CONTROL</p><h1>Admin <i>login.</i></h1><p className="login-copy">Sign in with your account to manage portfolio content and staff work.</p><form onSubmit={submit}><label htmlFor="admin-username">Username</label><input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" /><label htmlFor="admin-password">Password</label><div className="password-field"><input id="admin-password" type={showPassword ? 'text' : 'password'} autoFocus value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><label className="remember-option"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me on this device</label><button className="admin-save" disabled={loading}>{loading ? 'Checking...' : <><LogIn size={16} /> Sign in</>}</button>{error && <p className="login-error">{error}</p>}</form></div></main>
}

export default AdminLogin
