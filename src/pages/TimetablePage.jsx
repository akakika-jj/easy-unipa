import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import './TimetablePage.css'

const DAYS = ['月', '火', '水', '木', '金', '土']
const PERIODS = [1, 2, 3, 4, 5]

export default function TimetablePage() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [timetable, setTimetable] = useState({})
  const [loading, setLoading] = useState(true)
  const [showDays, setShowDays] = useState(['月', '火', '水', '木', '金'])

  useEffect(() => {
    if (!currentUser) return
    const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
    const unsubscribe = onSnapshot(ref, (snap) => {
      setTimetable(snap.exists() ? (snap.data().classes || {}) : {})
      setLoading(false)
    })
    return unsubscribe
  }, [currentUser])

  function handleCellClick(day, period) {
    navigate(`/class/${day}/${period}`)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function toggleSaturday() {
    setShowDays(prev =>
      prev.includes('土')
        ? ['月', '火', '水', '木', '金']
        : ['月', '火', '水', '木', '金', '土']
    )
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="timetable-page">
      <header className="app-header">
        <h1>📚 easy unipa</h1>
        <div className="header-actions">
          <span className="user-email">{currentUser.email}</span>
          <button className="logout-btn" onClick={handleLogout}>ログアウト</button>
        </div>
      </header>

      <div className="toolbar">
        <button
          className={`toggle-sat-btn ${showDays.includes('土') ? 'active' : ''}`}
          onClick={toggleSaturday}
        >
          {showDays.includes('土') ? '土曜を非表示' : '土曜を表示'}
        </button>
        <button className="toggle-sat-btn" onClick={() => navigate('/setup')}>
          ✏️ 時間割を編集
        </button>
      </div>

      <div className="timetable-wrapper">
        <div
          className="timetable-grid"
          style={{ gridTemplateColumns: `2.5rem repeat(${showDays.length}, 1fr)` }}
        >
          <div className="grid-corner" />
          {showDays.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}

          {PERIODS.map(period => (
            <>
              <div key={`period-${period}`} className="period-label">
                <span className="period-num">{period}</span>
                <span className="period-text">限</span>
              </div>

              {showDays.map(day => {
                const key = `${day}_${period}`
                const c = timetable[key]
                const hasClass = c && c.name

                return (
                  <button
                    key={key}
                    className={`class-cell ${hasClass ? 'has-class' : 'empty-cell'}`}
                    onClick={() => handleCellClick(day, period)}
                    aria-label={hasClass ? `${day}曜${period}限: ${c.name}` : `${day}曜${period}限: 未登録`}
                  >
                    {hasClass ? (
                      <div className="cell-content">
                        <span className="class-name">{c.name}</span>
                        {/* 教室・教授名・単位数を表示 */}
                        <div className="cell-meta">
                          {(c.building || c.room) && (
                            <span className="meta-room">
                              🏫 {[c.building, c.room].filter(Boolean).join(' ')}
                            </span>
                          )}
                          {c.teacher && (
                            <span className="meta-teacher">👤 {c.teacher}</span>
                          )}
                          {c.credits && (
                            <span className="meta-credits">📝 {c.credits}単位</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="empty-text">＋</span>
                    )}
                  </button>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
