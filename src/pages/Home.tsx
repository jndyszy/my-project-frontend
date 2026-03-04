import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHomeFeed, getMorePosts } from '../api/feed'
import { createPost } from '../api/posts'
import { uploadImage } from '../api/upload'
import PostCard from '../components/PostCard'
import type { Post, UserCard, HotTag, RecommendedUser } from '../types'

function Home() {
  const navigate = useNavigate()
  const [userCard, setUserCard] = useState<UserCard | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [hotTags, setHotTags] = useState<HotTag[]>([])
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([])
  const [nextCursor, setNextCursor] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // 排序
  const [sort, setSort] = useState<'timeline' | 'community'>(
    () => (localStorage.getItem('feedSort') as 'timeline' | 'community') || 'timeline'
  )

  // 发帖
  const [postContent, setPostContent] = useState('')
  const [postTags, setPostTags] = useState('')
  const [postImageUrls, setPostImageUrls] = useState<string[]>([])
  const [postVisibility, setPostVisibility] = useState('public')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [posting, setPosting] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    getHomeFeed(sort)
      .then(data => {
        setUserCard(data.user_card)
        setPosts(data.posts)
        setNextCursor(data.next_cursor)
        setHasMore(data.next_cursor !== '')
        setHotTags(data.hot_tags)
        setRecommendedUsers(data.recommended_users)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sort])

  // 无限滚动
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, nextCursor])

  const handleSortChange = (next: 'timeline' | 'community') => {
    if (next === sort) return
    localStorage.setItem('feedSort', next)
    setSort(next)
    setPosts([])
    setNextCursor('')
    setHasMore(true)
  }

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const data = await getMorePosts(nextCursor, 20, sort)
      setPosts(prev => [...prev, ...data.posts])
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch {} finally {
      setLoadingMore(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postContent.trim()) return
    setPosting(true)
    const tags = postTags.split(/[,，\s]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
    try {
      const data = await createPost(postContent.trim(), postImageUrls, tags, postVisibility)
      const newPost = {
        ...data.post,
        username: userCard!.username,
        profile_picture: userCard!.profile_picture,
        like_count: 0,
        comment_count: 0,
        is_liked: false,
      }
      setPosts(prev => [newPost, ...prev])
      setPostContent('')
      setPostTags('')
      setPostImageUrls([])
      setPostVisibility('public')
      if (userCard) {
        setUserCard(prev => prev ? { ...prev, post_count: prev.post_count + 1 } : prev)
      }
    } catch {} finally {
      setPosting(false)
    }
  }

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.post_id !== postId))
    if (userCard) {
      setUserCard(prev => prev ? { ...prev, post_count: prev.post_count - 1 } : prev)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const currentUserId = userCard?.user_id ?? ''

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.logo}>社交圈</span>
        <div style={s.headerRight}>
          <button style={s.searchBtn} onClick={() => navigate('/search')}>🔍 搜索</button>
          {userCard && (
            <>
              <span style={{ ...s.headerUsername, cursor: 'pointer' }} onClick={() => navigate(`/users/${userCard.user_id}`)}>{userCard.username}</span>
              <button style={s.logoutBtn} onClick={handleLogout}>退出</button>
            </>
          )}
        </div>
      </header>

      {loading ? (
        <div style={s.fullLoading}>加载中...</div>
      ) : (
        <div style={s.layout}>
          {/* 左侧栏 */}
          <aside style={s.sidebar}>
            {userCard && (
              <div style={s.card}>
                <div style={{ ...s.userAvatar, overflow: 'hidden' }}>
                  {userCard.profile_picture
                    ? <img src={userCard.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : userCard.username.charAt(0).toUpperCase()}
                </div>
                <div style={s.userCardName}>{userCard.username}</div>
                <div style={s.userCardEmail}>{userCard.email}</div>
                <div style={s.userStats}>
                  <div style={s.statItem}>
                    <span style={s.statNum}>{userCard.post_count}</span>
                    <span style={s.statLabel}>帖子</span>
                  </div>
                  <div style={s.statItem}>
                    <span style={s.statNum}>{userCard.following_count}</span>
                    <span style={s.statLabel}>关注</span>
                  </div>
                  <div style={s.statItem}>
                    <span style={s.statNum}>{userCard.follower_count}</span>
                    <span style={s.statLabel}>粉丝</span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* 中间 Feed */}
          <main style={s.feed}>
            {/* 排序切换 */}
            <div style={s.sortBar}>
              <button
                style={{ ...s.sortBtn, ...(sort === 'timeline' ? s.sortBtnActive : {}) }}
                onClick={() => handleSortChange('timeline')}
              >
                最新
              </button>
              <button
                style={{ ...s.sortBtn, ...(sort === 'community' ? s.sortBtnActive : {}) }}
                onClick={() => handleSortChange('community')}
              >
                热门
              </button>
            </div>

            {/* 发帖框 */}
            <form onSubmit={handleCreatePost} style={s.createPostCard}>
              <textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="分享你的想法..."
                style={s.createPostInput}
                rows={3}
              />
              {postImageUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {postImageUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px' }} alt="" />
                      <button type="button" onClick={() => setPostImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={s.createPostFooter}>
                <input
                  value={postTags}
                  onChange={e => setPostTags(e.target.value)}
                  placeholder="标签（逗号分隔，如: 旅行, 美食）"
                  style={s.tagInput}
                />
                <select
                  value={postVisibility}
                  onChange={e => setPostVisibility(e.target.value)}
                  style={s.visibilitySelect}
                >
                  <option value="public">🌐 公开</option>
                  <option value="followers">👥 关注者</option>
                  <option value="private">🔒 仅自己</option>
                </select>
                <label style={{ ...s.postBtn, background: '#f3f4f6', color: '#6b7280', cursor: uploadingImg ? 'not-allowed' : 'pointer' }}>
                  {uploadingImg ? '上传中' : '📎'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    disabled={uploadingImg}
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingImg(true)
                      try { const url = await uploadImage(file); setPostImageUrls(prev => [...prev, url]) }
                      catch {} finally { setUploadingImg(false); e.target.value = '' }
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={posting || !postContent.trim()}
                  style={{ ...s.postBtn, ...(posting || !postContent.trim() ? s.postBtnDisabled : {}) }}
                >
                  {posting ? '发布中...' : '发布'}
                </button>
              </div>
            </form>

            {/* 帖子列表 */}
            {posts.map(post => (
              <PostCard
                key={post.post_id}
                post={post}
                currentUserId={currentUserId}
                onDelete={handleDeletePost}
              />
            ))}

            {/* 无限滚动哨兵 */}
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && <p style={s.loadingMore}>加载更多...</p>}
            {!hasMore && posts.length > 0 && <p style={s.noMore}>已加载全部</p>}
            {posts.length === 0 && !loading && <p style={s.noMore}>还没有帖子，来发第一条吧！</p>}
          </main>

          {/* 右侧栏 */}
          <aside style={s.sidebar}>
            {hotTags.some(tag => tag.post_count > 0) && (
              <div style={s.card}>
                <h4 style={s.sideTitle}>热门标签</h4>
                {hotTags.filter(tag => tag.post_count > 0).map(tag => (
                  <div key={tag.tag_name} style={{ ...s.tagRow, cursor: 'pointer' }} onClick={() => navigate(`/tags/${tag.tag_name}`)}>
                    <span style={s.tagName}>#{tag.tag_name}</span>
                    <span style={s.tagCount}>{tag.post_count}</span>
                  </div>
                ))}
              </div>
            )}

            {recommendedUsers.length > 0 && (
              <div style={{ ...s.card, marginTop: '12px' }}>
                <h4 style={s.sideTitle}>推荐用户</h4>
                {recommendedUsers.map(user => (
                  <div key={user.user_id} style={{ ...s.recUserRow, cursor: 'pointer' }} onClick={() => navigate(`/users/${user.user_id}`)}>
                    <div style={{ ...s.recAvatar, overflow: 'hidden' }}>
                      {user.profile_picture
                        ? <img src={user.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={s.recInfo}>
                      <span style={s.recName}>{user.username}</span>
                      {user.bio && <span style={s.recBio}>{user.bio}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f4f5f7',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 24px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#4f46e5',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerUsername: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: 500,
  },
  searchBtn: {
    padding: '5px 14px',
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '5px 14px',
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  fullLoading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 56px)',
    fontSize: '15px',
    color: '#9ca3af',
  },
  layout: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '20px 16px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  sidebar: {
    width: '260px',
    flexShrink: 0,
    position: 'sticky',
    top: '76px',
  },
  feed: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  userAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 auto 10px',
  },
  userCardName: {
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '15px',
    color: '#1a1a1a',
  },
  userCardEmail: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
    marginBottom: '14px',
  },
  userStats: {
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statNum: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  sortBar: {
    display: 'flex',
    gap: '4px',
    background: '#fff',
    borderRadius: '10px',
    padding: '6px',
    marginBottom: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  sortBtn: {
    flex: 1,
    padding: '7px',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
    fontWeight: 500,
  },
  sortBtnActive: {
    background: '#ede9fe',
    color: '#4f46e5',
    fontWeight: 600,
  },
  visibilitySelect: {
    padding: '7px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6b7280',
    outline: 'none',
    background: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
  },
  createPostCard: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  createPostInput: {
    width: '100%',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  createPostFooter: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    padding: '7px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    color: '#6b7280',
  },
  postBtn: {
    padding: '7px 20px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  postBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loadingMore: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#9ca3af',
    padding: '12px',
  },
  noMore: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#d1d5db',
    padding: '16px',
  },
  sideTitle: {
    margin: '0 0 12px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  tagRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f9fafb',
  },
  tagName: {
    fontSize: '13px',
    color: '#4f46e5',
  },
  tagCount: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  recUserRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #f9fafb',
  },
  recAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#e0e7ff',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
  },
  recInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  recName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  recBio: {
    fontSize: '12px',
    color: '#9ca3af',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

export default Home
