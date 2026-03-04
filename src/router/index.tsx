import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import Home from '../pages/Home'
import UserProfile from '../pages/UserProfile'
import EditProfile from '../pages/EditProfile'
import Search from '../pages/Search'
import TagPosts from '../pages/TagPosts'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/tags/:name" element={<TagPosts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
