import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './SplashPage.css'

export default function SplashPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  // 2秒後に自動で次の画面へ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentUser) {
        navigate('/')
      } else {
        navigate('/login')
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [currentUser, navigate])

  return (
    <div className="splash-page">
      <div className="splash-content">
        <div className="splash-icon">📚</div>
        <h1 className="splash-title">easy unipa</h1>
        <p className="splash-subtitle">大学授業情報管理アプリ</p>
        <div className="splash-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}
