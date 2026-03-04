# Lifestyle Content Sharing — Frontend

A community-driven lifestyle content sharing web application built with React + TypeScript. Part of the CN6000 final project.

> **Backend repository**: Go (Gin) REST API — see backend repo for setup instructions.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build Tool | Vite 7 |
| Routing | React Router v6 |
| Styling | Inline CSS (React CSSProperties) |
| Auth | JWT Bearer Token (stored in localStorage) |
| HTTP | Native Fetch API |

---

## Features

### Authentication
- User registration with client-side validation
- Login with JWT token management
- Password reset via email OTP (6-digit code)
- Auto logout on token expiry (401 detection)

### Home Feed
- **Two sorting modes**: Timeline (chronological) and Community (HackerNews decay algorithm weighted by likes + comments)
- Infinite scroll via `IntersectionObserver`
- Sort preference persisted to `localStorage`
- Create posts with text, images, tags, and visibility setting

### Posts
- Create / Edit / Delete posts
- Image upload support
- Tag system with clickable tags
- **Visibility control**: Public / Followers only / Private
- Like / Unlike with optimistic UI updates
- Comment section (lazy-loaded on demand)
- Edit and delete own comments
- **Report posts and comments** with reason selection

### User Profiles
- View any user's profile: posts, following list, followers list
- Follow / Unfollow with real-time count update
- Edit own profile: username, bio, avatar upload
- **Account deletion** with username confirmation (Right to be Forgotten)

### Discovery
- Hot tags sidebar (from Redis sorted set, filters out zero-count tags)
- Recommended users sidebar
- Search users by username
- Full-text search for posts (PostgreSQL tsvector GIN index)
- Browse posts by tag with infinite scroll

---

## Project Structure

```
src/
├── api/
│   ├── request.ts        # Base fetch wrapper with JWT auth
│   ├── auth.ts           # Login, register, password reset
│   ├── feed.ts           # Home feed, load more (sort param)
│   ├── posts.ts          # Post CRUD, likes, comments, reports
│   ├── users.ts          # User profile, follow, delete account
│   ├── search.ts         # Search users and posts
│   └── upload.ts         # Image upload (multipart/form-data)
├── components/
│   └── PostCard.tsx      # Post card with full interaction support
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── Home.tsx
│   ├── UserProfile.tsx
│   ├── EditProfile.tsx
│   ├── Search.tsx
│   └── TagPosts.tsx
├── router/
│   └── index.tsx         # Route definitions
└── types/
    └── index.ts          # Shared TypeScript interfaces
```

---

## Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | Login | ❌ |
| `/register` | Register | ❌ |
| `/forgot-password` | Forgot Password | ❌ |
| `/reset-password` | Reset Password | ❌ |
| `/home` | Home Feed | ✅ |
| `/users/:id` | User Profile | ✅ |
| `/profile/edit` | Edit Profile | ✅ |
| `/search` | Search | ✅ |
| `/tags/:name` | Tag Posts | ✅ |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:8080`

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

---

## API Overview

All authenticated requests include `Authorization: Bearer <token>` in the header. The base URL is `http://localhost:8080`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login, returns JWT |
| POST | `/api/register` | Register |
| POST | `/api/logout` | Logout (token blacklisted in Redis) |
| GET | `/api/feed/home?sort=timeline\|community` | Home feed |
| GET | `/api/feed/posts?sort=&cursor=` | Load more posts |
| POST | `/api/posts` | Create post |
| PUT | `/api/posts/:id` | Edit post |
| DELETE | `/api/posts/:id` | Delete post (soft delete) |
| POST | `/api/posts/:id/like` | Like post |
| GET | `/api/posts/:id/comments` | Get comments |
| POST | `/api/posts/:id/comments` | Post comment |
| POST | `/api/posts/:id/report` | Report post |
| POST | `/api/users/:id/follow` | Follow user |
| GET | `/api/users/:id` | User profile |
| PUT | `/api/users/me` | Update profile |
| DELETE | `/api/users/me` | Delete account |
| GET | `/api/search/users?q=` | Search users |
| GET | `/api/search/posts?q=` | Search posts (full-text) |
| GET | `/api/tags/:name/posts` | Posts by tag |
| POST | `/api/upload/image` | Upload image |

---

## Key Implementation Notes

**Infinite Scroll** — Uses `IntersectionObserver` to watch a sentinel `<div>` at the bottom of the feed. Supports both timestamp-based cursors (timeline mode) and integer offset cursors (community mode).

**Optimistic Updates** — Like/unlike interactions update the UI immediately and roll back on API failure, keeping interactions feel instant.

**Image Upload** — Uses raw `fetch` with `FormData` (not the shared JSON request wrapper) so the browser can automatically set the `multipart/form-data` boundary.

**JWT Handling** — The shared `request.ts` wrapper only redirects to login on 401 if a token already exists in `localStorage`. This prevents login failure responses from triggering an unwanted redirect loop.

---

## License

Academic project — CN6000 MWPL, 2026
