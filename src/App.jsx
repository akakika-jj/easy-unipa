import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SplashPage from './pages/SplashPage'
import LoginPage from './pages/LoginPage'
import TimetablePage from './pages/TimetablePage'
import ClassDetailPage from './pages/ClassDetailPage'
import SetupPage from './pages/SetupPage'
import AttendancePage from './pages/AttendancePage'

// ログイン済みのみアクセスできるルート
function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" replace />
}

// 未ログイン時のみアクセスできるルート
function PublicRoute({ children }) {
  const { currentUser } = useAuth()
  return !currentUser ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* スプラッシュ画面（起動時） */}
      <Route path="/splash" element={<SplashPage />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/setup"
        element={
          <PrivateRoute>
            <SetupPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <TimetablePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/class/:day/:period"
        element={
          <PrivateRoute>
            <ClassDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/class/:day/:period/attendance"
        element={
          <PrivateRoute>
            <AttendancePage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/splash" replace />} />
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
