import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, deleteAccount } from '../api/users'
import { uploadImage } from '../api/upload'

function EditProfile() {
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const [username, setUsername] = useState(currentUser.username ?? '')
  const [bio, setBio] = useState(currentUser.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(currentUser.profile_picture ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 账号注销
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setAvatarUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username.length < 3 || username.length > 50) {
      setError('用户名须为 3~50 个字符')
      return
    }
    setError('')
    setSaving(true)
    try {
      const data = await updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        profile_picture: avatarUrl,
      })
      const updated = { ...currentUser, ...data.user }
      localStorage.setItem('user', JSON.stringify(updated))
      navigate(`/users/${currentUser.user_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== currentUser.username) {
      setDeleteError('用户名输入错误，请重新输入')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/', { state: { message: '账号已注销' } })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '注销失败，请重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>← 返回</button>
        <span style={s.title}>编辑资料</span>
      </header>

      <div style={s.body}>
        <form onSubmit={handleSubmit} style={s.form}>
          {/* 头像 */}
          <div style={s.avatarSection}>
            <div style={s.avatar}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={s.avatarImg} />
                : <span style={s.avatarChar}>{username.charAt(0).toUpperCase()}</span>
              }
            </div>
            <label style={s.uploadLabel}>
              {uploading ? '上传中...' : '更换头像'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={uploading} />
            </label>
          </div>

          <div style={s.field}>
            <label style={s.label}>用户名</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="3~50 个字符"
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>个人简介</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="介绍一下自己..."
              rows={3}
              style={s.textarea}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={saving || uploading} style={{ ...s.saveBtn, ...(saving ? s.disabled : {}) }}>
            {saving ? '保存中...' : '保存'}
          </button>
        </form>

        {/* 注销账号 */}
        <div style={s.dangerZone}>
          <button style={s.deleteBtn} onClick={() => setShowDeleteModal(true)}>注销账号</button>
        </div>
      </div>

      {/* 注销确认弹窗 */}
      {showDeleteModal && (
        <div style={s.modalOverlay} onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError('') }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <p style={s.modalTitle}>注销账号</p>
            <p style={s.modalDesc}>此操作不可逆，账号下所有帖子、评论、关注关系将被清除。</p>
            <p style={s.modalDesc}>请输入你的用户名 <strong>{currentUser.username}</strong> 以确认：</p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="输入用户名"
              style={s.confirmInput}
              autoFocus
            />
            {deleteError && <p style={s.deleteError}>{deleteError}</p>}
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError('') }}>取消</button>
              <button
                style={{ ...s.saveBtn, background: '#e53e3e', ...(deleting ? s.disabled : {}) }}
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? '注销中...' : '确认注销'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f4f5f7' },
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: '#fff', borderBottom: '1px solid #e5e7eb',
    padding: '0 20px', height: '56px',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  backBtn: { background: 'none', border: 'none', fontSize: '14px', color: '#6b7280', cursor: 'pointer', padding: '4px 8px' },
  title: { fontSize: '16px', fontWeight: 600, color: '#1a1a1a' },
  body: { maxWidth: '480px', margin: '0 auto', padding: '24px 16px' },
  form: { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '20px' },
  avatarSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarChar: { color: '#fff', fontSize: '30px', fontWeight: 700 },
  uploadLabel: {
    padding: '6px 16px', borderRadius: '6px', border: '1px solid #d1d5db',
    fontSize: '13px', color: '#6b7280', cursor: 'pointer',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 500, color: '#555' },
  input: { padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%' },
  textarea: { padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' },
  error: { margin: 0, fontSize: '13px', color: '#e53e3e' },
  saveBtn: { padding: '11px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' },
  disabled: { opacity: 0.6, cursor: 'not-allowed' },
  dangerZone: { marginTop: '16px', textAlign: 'center' as const },
  deleteBtn: { background: 'none', border: 'none', color: '#e53e3e', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' },
  modalOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '12px', padding: '24px', width: '360px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: '18px', fontWeight: 700, color: '#e53e3e', margin: '0 0 12px' },
  modalDesc: { fontSize: '14px', color: '#4b5563', margin: '0 0 10px', lineHeight: 1.6 },
  confirmInput: { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, marginTop: '4px' },
  deleteError: { margin: '8px 0 0', fontSize: '13px', color: '#e53e3e' },
  modalBtns: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
  cancelBtn: { padding: '9px 18px', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', color: '#6b7280' },
}

export default EditProfile
