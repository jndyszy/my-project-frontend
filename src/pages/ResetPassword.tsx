import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { confirmPasswordReset } from '../api/auth'

function ResetPassword() {
  const location = useLocation()
  const email = (location.state as { email?: string })?.email ?? ''

  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    if (!/^\d{6}$/.test(otpCode)) return '验证码为 6 位数字'
    if (newPassword.length < 6) return '新密码至少 6 个字符'
    if (newPassword !== confirmPassword) return '两次输入的密码不一致'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setLoading(true)
    try {
      await confirmPasswordReset(email, otpCode, newPassword)
      navigate('/', { state: { message: '密码重置成功，请重新登录' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请检查验证码是否正确')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <p style={{ textAlign: 'center', color: '#555', fontSize: '14px' }}>
            页面已过期，请重新
            <Link to="/forgot-password" style={s.link}> 找回密码</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h2 style={s.title}>重置密码</h2>
        <p style={s.desc}>验证码已发送至<br /><strong>{email}</strong></p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>验证码</label>
            <input
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="请输入 6 位验证码"
              maxLength={6}
              required
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少 6 个字符"
              required
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              required
              style={s.input}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={{ ...s.button, ...(loading ? s.disabled : {}) }}>
            {loading ? '重置中...' : '重置密码'}
          </button>
        </form>

        <div style={s.footer}>
          <Link to="/forgot-password" style={s.link}>← 重新发送验证码</Link>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f4f5f7',
  },
  card: {
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '22px',
    fontWeight: 600,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  desc: {
    margin: '0 0 24px',
    fontSize: '13px',
    color: '#888',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#555',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    margin: 0,
    fontSize: '13px',
    color: '#e53e3e',
  },
  button: {
    padding: '11px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '4px',
  },
  disabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  },
  link: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontSize: '14px',
  },
}

export default ResetPassword
