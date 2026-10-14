import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import './ClassDetailPage.css'

export default function ClassDetailPage() {
  const { day, period } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [classData, setClassData] = useState({
    name: '',
    room: '',
    building: '',
    teacher: '',
    credits: '',
    memo: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const classKey = `${day}_${period}`

  // Firestoreからデータ取得
  useEffect(() => {
    async function fetchData() {
      const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data().classes || {}
        if (data[classKey]) {
          setClassData(prev => ({ ...prev, ...data[classKey] }))
        } else {
          // 新規登録モードで開く
          setIsEditing(true)
        }
      } else {
        setIsEditing(true)
      }
      setLoading(false)
    }
    fetchData()
  }, [currentUser, classKey])

  // 保存処理
  async function handleSave() {
    if (!classData.name.trim()) {
      alert('授業名を入力してください')
      return
    }
    setSaving(true)

    try {
      const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
      const snap = await getDoc(ref)
      const existing = snap.exists() ? (snap.data().classes || {}) : {}

      await setDoc(ref, {
        classes: {
          ...existing,
          [classKey]: {
            name: classData.name.trim(),
            room: classData.room.trim(),
            building: classData.building.trim(),
            teacher: classData.teacher.trim(),
            credits: classData.credits.trim(),
            memo: classData.memo.trim(),
          }
        }
      })

      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('保存に失敗しました。もう一度お試しください。')
    }
    setSaving(false)
  }

  // 授業削除
  async function handleDelete() {
    if (!confirm(`${day}曜${period}限の授業を削除しますか？`)) return

    const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().classes || {}
      delete data[classKey]
      await setDoc(ref, { classes: data })
    }
    navigate('/')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  const hasClass = classData.name.trim() !== ''

  return (
    <div className="detail-page">
      {/* ヘッダー */}
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 時間割に戻る
        </button>
        <h2>{day}曜 {period}限</h2>
        {hasClass && !isEditing && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>編集</button>
        )}
        {isEditing && hasClass && (
          <button className="delete-btn" onClick={handleDelete}>削除</button>
        )}
      </header>

      <div className="detail-content">
        {/* 授業名 */}
        <section className="detail-section">
          <h3 className="section-title">📖 授業名</h3>
          {isEditing ? (
            <input
              className="input-field"
              value={classData.name}
              onChange={(e) => setClassData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例：英語コミュニケーション"
              autoFocus
            />
          ) : (
            <p className="info-text large">{classData.name || '未登録'}</p>
          )}
        </section>

        {/* 教室情報 */}
        <section className="detail-section">
          <h3 className="section-title">🏫 授業情報</h3>
          {isEditing ? (
            <div className="input-stack">
              <div className="input-row">
                <div className="input-group">
                  <label>建物名</label>
                  <input
                    className="input-field"
                    value={classData.building}
                    onChange={(e) => setClassData(prev => ({ ...prev, building: e.target.value }))}
                    placeholder="例：A棟、本館"
                  />
                </div>
                <div className="input-group">
                  <label>教室番号</label>
                  <input
                    className="input-field"
                    value={classData.room}
                    onChange={(e) => setClassData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="例：301、大講義室"
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>教授名</label>
                  <input
                    className="input-field"
                    value={classData.teacher}
                    onChange={(e) => setClassData(prev => ({ ...prev, teacher: e.target.value }))}
                    placeholder="例：山田 太郎"
                  />
                </div>
                <div className="input-group">
                  <label>単位数</label>
                  <input
                    className="input-field"
                    value={classData.credits}
                    onChange={(e) => setClassData(prev => ({ ...prev, credits: e.target.value }))}
                    placeholder="例：2.0"
                    type="number"
                    step="0.5"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="info-card">
              {classData.building || classData.room || classData.teacher || classData.credits ? (
                <>
                  {classData.building && <span className="tag">🏢 {classData.building}</span>}
                  {classData.room && <span className="tag">🚪 {classData.room}</span>}
                  {classData.teacher && <span className="tag">👤 {classData.teacher}</span>}
                  {classData.credits && <span className="tag">📝 {classData.credits}単位</span>}
                </>
              ) : (
                <p className="no-data">未登録</p>
              )}
            </div>
          )}
        </section>

        {/* メモ */}
        <section className="detail-section">
          <h3 className="section-title">📝 メモ</h3>
          {isEditing ? (
            <textarea
              className="textarea-field"
              value={classData.memo}
              onChange={(e) => setClassData(prev => ({ ...prev, memo: e.target.value }))}
              placeholder="持ち物、先生からの連絡、課題・提出期限など"
              rows={4}
            />
          ) : (
            <div className="memo-display">
              {classData.memo ? (
                <p className="memo-text">{classData.memo}</p>
              ) : (
                <p className="no-data">メモなし</p>
              )}
            </div>
          )}
        </section>

        {/* 保存ボタン */}
        {isEditing && (
          <div className="action-row">
            {hasClass && (
              <button
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                キャンセル
              </button>
            )}
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        )}

        {saved && (
          <div className="saved-toast">✓ 保存しました</div>
        )}

        {/* 成績・出欠へのリンク（第2段階で実装） */}
        {hasClass && !isEditing && (
          <div className="feature-links">
            <button
              className="feature-btn"
              onClick={() => navigate(`/class/${day}/${period}/grades`)}
            >
              📊 成績評価の配分
            </button>
            <button
              className="feature-btn"
              onClick={() => navigate(`/class/${day}/${period}/attendance`)}
            >
              📋 出欠状況の管理
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
