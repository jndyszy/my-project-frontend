import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { sendPasswordResetCode } from '../api/auth'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendPasswordResetCode(email)
      navigate('/reset-password', { state: { email } })
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h2 style={s.title}>找回密码</h2>
        <p style={s.desc}>输入注册邮箱，我们将向您发送 6 位验证码</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入注册邮箱"
              required
              style={s.input}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={{ ...s.button, ...(loading ? s.disabled : {}) }}>
            {loading ? '发送中...' : '发送验证码'}
          </button>
        </form>

        <div style={s.footer}>
          <Link to="/" style={s.link}>← 返回登录</Link>
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

export default ForgotPassword
