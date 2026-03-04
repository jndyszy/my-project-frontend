import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { likePost, unlikePost, deletePost, updatePost, getComments, createComment, deleteComment, reportPost, reportComment } from '../api/posts'
import { uploadImage } from '../api/upload'
import type { Post, Comment } from '../types'

interface Props {
  post: Post
  currentUserId: string
  onDelete: (postId: string) => void
}

function PostCard({ post: initial, currentUserId, onDelete }: Props) {
  const navigate = useNavigate()
  const [content, setContent] = useState(initial.content)
  const [liked, setLiked] = useState(initial.is_liked)
  const [likeCount, setLikeCount] = useState(initial.like_count)
  const [commentCount, setCommentCount] = useState(initial.comment_count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState(initial.tags)
  const [imageUrls, setImageUrls] = useState(initial.image_urls)
  const [visibility, setVisibility] = useState(initial.visibility ?? 'public')
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(initial.content)
  const [editTags, setEditTags] = useState(initial.tags.join(', '))
  const [editImageUrls, setEditImageUrls] = useState<string[]>(initial.image_urls)
  const [editVisibility, setEditVisibility] = useState(initial.visibility ?? 'public')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [saving, setSaving] = useState(false)

  // 菜单 & 举报
  const [showMenu, setShowMenu] = useState(false)
  const [reportModal, setReportModal] = useState<null | { type: 'post' } | { type: 'comment'; commentId: string }>(null)
  const [reportReason, setReportReason] = useState('违法违规')
  const [reporting, setReporting] = useState(false)
  const [reportDone, setReportDone] = useState(false)

  const isOwner = initial.user_id === currentUserId

  const handleLike = async () => {
    const prev = { liked, likeCount }
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    try {
      liked ? await unlikePost(initial.post_id) : await likePost(initial.post_id)
    } catch {
      setLiked(prev.liked)
      setLikeCount(prev.likeCount)
    }
  }

  const handleToggleComments = async () => {
    if (!commentsLoaded) {
      setLoadingComments(true)
      try {
        const data = await getComments(initial.post_id)
        setComments(data.comments)
        setCommentsLoaded(true)
      } catch {} finally {
        setLoadingComments(false)
      }
    }
    setShowComments(v => !v)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim()) return
    setSubmitting(true)
    try {
      const data = await createComment(initial.post_id, commentInput.trim())
      setComments(prev => [...prev, data.comment])
      setCommentCount(c => c + 1)
      setCommentInput('')
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(initial.post_id, commentId)
      setComments(prev => prev.filter(c => c.comment_id !== commentId))
      setCommentCount(c => c - 1)
    } catch {}
  }

  const handleDeletePost = async () => {
    if (!confirm('确定要删除这条帖子吗？')) return
    try {
      await deletePost(initial.post_id)
      onDelete(initial.post_id)
    } catch {}
  }

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const url = await uploadImage(file)
      setEditImageUrls(prev => [...prev, url])
    } catch {} finally {
      setUploadingImg(false)
      e.target.value = ''
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return
    setSaving(true)
    const newTags = editTags.split(/[,，\s]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
    try {
      await updatePost(initial.post_id, editContent.trim(), editImageUrls, newTags, editVisibility)
      setContent(editContent.trim())
      setTags(newTags)
      setImageUrls(editImageUrls)
      setVisibility(editVisibility)
      setEditing(false)
    } catch {} finally {
      setSaving(false)
    }
  }

  const handleReport = async () => {
    if (!reportModal) return
    setReporting(true)
    try {
      if (reportModal.type === 'post') {
        await reportPost(initial.post_id, reportReason)
      } else {
        await reportComment(initial.post_id, reportModal.commentId, reportReason)
      }
      setReportDone(true)
      setTimeout(() => { setReportModal(null); setReportDone(false); setReportReason('违法违规') }, 1500)
    } catch {} finally {
      setReporting(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const avatarChar = initial.username.charAt(0).toUpperCase()
  const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' }

  return (
    <div style={s.card}>
      {/* 作者行 */}
      <div style={s.authorRow}>
        <div style={{ ...s.avatar, overflow: 'hidden' }}>
          {initial.profile_picture ? <img src={initial.profile_picture} alt="" style={imgStyle} /> : avatarChar}
        </div>
        <div style={s.authorInfo}>
          <span style={s.username} onClick={() => navigate(`/users/${initial.user_id}`)}>{initial.username}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={s.time}>{formatTime(initial.created_at)}</span>
            {isOwner && visibility !== 'public' && (
              <span style={s.visibilityBadge}>
                {visibility === 'private' ? '🔒' : '👥'}
              </span>
            )}
          </div>
        </div>
        {isOwner && !editing && (
          <div style={s.ownerActions}>
            <button style={s.textBtn} onClick={() => { setEditing(true); setEditContent(content); setEditTags(tags.join(', ')); setEditVisibility(visibility) }}>编辑</button>
            <button style={{ ...s.textBtn, color: '#e53e3e' }} onClick={handleDeletePost}>删除</button>
          </div>
        )}
        {!isOwner && !editing && (
          <div style={{ position: 'relative' }}>
            <button style={s.menuBtn} onClick={() => setShowMenu(v => !v)}>···</button>
            {showMenu && (
              <div style={s.menuDropdown}>
                <button style={s.menuItem} onClick={() => { setShowMenu(false); setReportModal({ type: 'post' }) }}>
                  举报
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 内容 */}
      {editing ? (
        <div style={s.editArea}>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            style={s.textarea}
            rows={3}
          />
          <input
            value={editTags}
            onChange={e => setEditTags(e.target.value)}
            placeholder="标签（逗号分隔，如: 旅行, 美食）"
            style={{ ...s.textarea, marginTop: '8px', padding: '7px 10px', resize: 'none' }}
          />
          {editImageUrls.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {editImageUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px' }} alt="" />
                  <button
                    onClick={() => setEditImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer', lineHeight: 1, padding: 0 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
          <label style={{ marginTop: '8px', display: 'inline-block', padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', color: '#6b7280', cursor: uploadingImg ? 'not-allowed' : 'pointer' }}>
            {uploadingImg ? '上传中...' : '+ 添加图片'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditImageUpload} disabled={uploadingImg} />
          </label>
          <select
            value={editVisibility}
            onChange={e => setEditVisibility(e.target.value)}
            style={{ marginTop: '8px', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: '#6b7280', outline: 'none', background: '#fff' }}
          >
            <option value="public">🌐 公开</option>
            <option value="followers">👥 仅关注者</option>
            <option value="private">🔒 仅自己</option>
          </select>
          <div style={s.editBtns}>
            <button style={s.cancelBtn} onClick={() => setEditing(false)}>取消</button>
            <button style={s.saveBtn} disabled={saving} onClick={handleSaveEdit}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      ) : (
        <p style={s.content}>{content}</p>
      )}

      {/* 图片 */}
      {imageUrls.length > 0 && (
        <div style={s.imageGrid}>
          {imageUrls.map((url, i) => (
            <img key={i} src={url} alt="" style={s.image} />
          ))}
        </div>
      )}

      {/* 标签 */}
      {tags.length > 0 && (
        <div style={s.tags}>
          {tags.map(tag => (
            <span key={tag} style={s.tag} onClick={() => navigate(`/tags/${tag}`)}>#{tag}</span>
          ))}
        </div>
      )}

      {/* 操作栏 */}
      <div style={s.actionBar}>
        <button style={{ ...s.actionBarBtn, ...(liked ? s.likedBtn : {}) }} onClick={handleLike}>
          {liked ? '♥' : '♡'} {likeCount}
        </button>
        <button style={s.actionBarBtn} onClick={handleToggleComments}>
          💬 {commentCount}
        </button>
      </div>

      {/* 举报弹窗 */}
      {reportModal && (
        <div style={s.modalOverlay} onClick={() => { setReportModal(null); setReportDone(false) }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <p style={s.modalTitle}>举报{reportModal.type === 'post' ? '帖子' : '评论'}</p>
            {reportDone ? (
              <p style={s.reportSuccess}>已收到您的举报，我们将在 24 小时内处理</p>
            ) : (
              <>
                <p style={s.modalLabel}>选择举报原因</p>
                {['违法违规', '色情低俗', '虚假信息', '垃圾广告', '其他'].map(r => (
                  <label key={r} style={s.reasonRow}>
                    <input type="radio" name="reason" value={r} checked={reportReason === r} onChange={() => setReportReason(r)} />
                    <span style={{ marginLeft: '8px', fontSize: '14px', color: '#374151' }}>{r}</span>
                  </label>
                ))}
                <div style={s.modalBtns}>
                  <button style={s.cancelBtn} onClick={() => setReportModal(null)}>取消</button>
                  <button style={{ ...s.saveBtn, background: '#e53e3e' }} disabled={reporting} onClick={handleReport}>
                    {reporting ? '提交中...' : '提交举报'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 评论区 */}
      {showComments && (
        <div style={s.comments}>
          {loadingComments ? (
            <p style={s.hint}>加载中...</p>
          ) : (
            <>
              {comments.length === 0 && <p style={s.hint}>暂无评论</p>}
              {comments.map(c => (
                <div key={c.comment_id} style={s.commentItem}>
                  <div style={{ ...s.commentAvatar, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/users/${c.user_id}`)}>
                    {c.profile_picture ? <img src={c.profile_picture} alt="" style={imgStyle} /> : c.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={s.commentBody}>
                    <span style={{ ...s.commentUsername, cursor: 'pointer' }} onClick={() => navigate(`/users/${c.user_id}`)}>{c.username}</span>
                    <span style={s.commentContent}>{c.content}</span>
                  </div>
                  {c.user_id === currentUserId
                    ? <button style={s.deleteCommentBtn} onClick={() => handleDeleteComment(c.comment_id)}>×</button>
                    : <button style={s.deleteCommentBtn} title="举报" onClick={() => setReportModal({ type: 'comment', commentId: c.comment_id })}>⚑</button>
                  }
                </div>
              ))}
              <form onSubmit={handleSubmitComment} style={s.commentForm}>
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="写下你的评论..."
                  style={s.commentInput}
                />
                <button
                  type="submit"
                  disabled={submitting || !commentInput.trim()}
                  style={{ ...s.sendBtn, ...(submitting || !commentInput.trim() ? s.sendBtnDisabled : {}) }}
                >
                  发送
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '15px',
    flexShrink: 0,
  },
  authorInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  username: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    cursor: 'pointer',
  },
  time: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  ownerActions: {
    display: 'flex',
    gap: '8px',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '2px 6px',
  },
  content: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  editArea: {
    marginBottom: '12px',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
  },
  editBtns: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '5px 14px',
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  saveBtn: {
    padding: '5px 14px',
    background: '#4f46e5',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#fff',
    cursor: 'pointer',
  },
  imageGrid: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  tag: {
    fontSize: '12px',
    color: '#4f46e5',
    background: '#ede9fe',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  actionBar: {
    display: 'flex',
    gap: '16px',
    paddingTop: '10px',
    borderTop: '1px solid #f3f4f6',
  },
  actionBarBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  likedBtn: {
    color: '#e53e3e',
  },
  comments: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  hint: {
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: '8px 0',
  },
  commentItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '10px',
  },
  commentAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#e0e7ff',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
  },
  commentBody: {
    flex: 1,
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  commentUsername: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
  },
  commentContent: {
    fontSize: '13px',
    color: '#4b5563',
  },
  visibilityBadge: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '2px 6px',
    letterSpacing: '1px',
    lineHeight: 1,
  },
  menuDropdown: {
    position: 'absolute' as const,
    right: 0,
    top: '100%',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    minWidth: '100px',
    overflow: 'hidden',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#e53e3e',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '320px',
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 16px',
  },
  modalLabel: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 10px',
  },
  reasonRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  modalBtns: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },
  reportSuccess: {
    fontSize: '14px',
    color: '#059669',
    textAlign: 'center' as const,
    padding: '12px 0',
  },
  deleteCommentBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    padding: '2px 4px',
  },
  commentForm: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  commentInput: {
    flex: 1,
    padding: '7px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    fontSize: '13px',
    outline: 'none',
  },
  sendBtn: {
    padding: '7px 14px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  sendBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}

export default PostCard
