import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SplashPage from './pages/SplashPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import TimetablePage from './pages/TimetablePage'
import ClassDetailPage from './pages/ClassDetailPage'
import SetupPage from './pages/SetupPage'
import AttendancePage from './pages/AttendancePage'

function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth()
  return !currentUser ? children : <Navigate to="/home" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* タイトル画面（起動時） */}
      <Route path="/" element={<SplashPage />} />
      <Route path="/splash" element={<SplashPage />} />

      {/* ログイン */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* ホーム */}
      <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />

      {/* 時間割セットアップ */}
      <Route path="/setup" element={<PrivateRoute><SetupPage /></PrivateRoute>} />

      {/* 時間割表 */}
      <Route path="/timetable" element={<PrivateRoute><TimetablePage /></PrivateRoute>} />

      {/* 授業詳細 */}
      <Route path="/class/:day/:period" element={<PrivateRoute><ClassDetailPage /></PrivateRoute>} />

      {/* 出欠管理 */}
      <Route path="/class/:day/:period/attendance" element={<PrivateRoute><AttendancePage /></PrivateRoute>} />

      {/* それ以外はタイトルへ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
