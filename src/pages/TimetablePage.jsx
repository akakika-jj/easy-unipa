import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import './TimetablePage.css'

const DAYS = ['月', '火', '水', '木', '金', '土']
const PERIODS = [1, 2, 3, 4, 5]

// 授業名から括弧内の補足を除去して短くする
function shortenName(name) {
  if (!name) return ''
  // （）や()の中身を削除
  const shortened = name.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim()
  return shortened || name
}

export default function TimetablePage() {
  const { currentUser } = useAuth()
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
        <button className="header-back-btn" onClick={() => navigate('/home')}>
          ← ホーム
        </button>
        <h1>時間割表</h1>
        <button
          className={`sat-toggle ${showDays.includes('土') ? 'active' : ''}`}
          onClick={toggleSaturday}
        >
          土
        </button>
      </header>

      <div className="timetable-wrapper">
        <div
          className="timetable-grid"
          style={{ gridTemplateColumns: `2.2rem repeat(${showDays.length}, 1fr)` }}
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
                    onClick={() => navigate(`/class/${day}/${period}`)}
                    aria-label={hasClass ? `${day}曜${period}限: ${c.name}` : `${day}曜${period}限: 未登録`}
                  >
                    {hasClass ? (
                      <div className="cell-content">
                        {/* 括弧内を省略した授業名 */}
                        <span className="class-name">{shortenName(c.name)}</span>
                        {/* 教室番号のみ表示 */}
                        {(c.building || c.room) && (
                          <span className="meta-room">
                            {[c.building, c.room].filter(Boolean).join(' ')}
                          </span>
                        )}
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
