import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './HomePage.css'

// シラバスURLは後で設定（大学のURLに変更してください）
const SYLLABUS_URL = 'https://www.example.ac.jp/syllabus'

export default function HomePage() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="home-page">
      {/* ヘッダー */}
      <header className="home-header">
        <div className="home-header-left">
          <span className="home-logo">📚</span>
          <h1 className="home-title">easy unipa</h1>
        </div>
        <button className="home-logout-btn" onClick={handleLogout}>ログアウト</button>
      </header>

      <div className="home-content">
        {/* ウェルカムメッセージ */}
        <div className="welcome-card">
          <p className="welcome-text">おかえり！👋</p>
          <p className="welcome-email">{currentUser?.email}</p>
        </div>

        {/* メインメニュー */}
        <div className="menu-grid">
          {/* 時間割表 */}
          <button
            className="menu-card primary"
            onClick={() => navigate('/timetable')}
          >
            <span className="menu-icon">📅</span>
            <span className="menu-label">時間割表</span>
            <span className="menu-desc">授業の一覧を確認</span>
          </button>

          {/* 時間割を登録・編集 */}
          <button
            className="menu-card"
            onClick={() => navigate('/setup')}
          >
            <span className="menu-icon">✏️</span>
            <span className="menu-label">時間割を登録・編集</span>
            <span className="menu-desc">授業をまとめて登録</span>
          </button>

          {/* シラバス */}
          <a
            className="menu-card"
            href={SYLLABUS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="menu-icon">🎓</span>
            <span className="menu-label">シラバスを開く</span>
            <span className="menu-desc">大学のシラバスサイトへ</span>
          </a>
        </div>

        {/* 使い方ヒント */}
        <div className="hint-card">
          <p className="hint-title">💡 使い方</p>
          <ol className="hint-list">
            <li>「時間割を登録・編集」で授業を登録</li>
            <li>「時間割表」で授業を確認・タップ</li>
            <li>各授業から出欠・成績を管理</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
