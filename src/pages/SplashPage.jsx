import { useNavigate } from 'react-router-dom'
import './SplashPage.css'

export default function SplashPage() {
  const navigate = useNavigate()

  return (
    <div className="splash-page">
      <div className="splash-content">
        <div className="splash-icon">📚</div>
        <h1 className="splash-title">easy unipa</h1>
        <p className="splash-subtitle">大学授業情報管理アプリ</p>
        <p className="splash-catch">時間割・出欠・成績をまとめて管理</p>

        <button
          className="splash-start-btn"
          onClick={() => navigate('/login')}
        >
          はじめる →
        </button>
      </div>

      {/* 背景の装飾 */}
      <div className="splash-deco deco1">📖</div>
      <div className="splash-deco deco2">✏️</div>
      <div className="splash-deco deco3">🎓</div>
      <div className="splash-deco deco4">📝</div>
    </div>
  )
}
