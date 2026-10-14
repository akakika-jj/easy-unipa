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
    name: '', room: '', building: '', teacher: '', credits: '', memo: '',
    gradeItems: [], // [{label, weight}]
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newGradeLabel, setNewGradeLabel] = useState('')
  const [newGradeWeight, setNewGradeWeight] = useState('')

  const classKey = `${day}_${period}`

  useEffect(() => {
    async function fetchData() {
      const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data().classes || {}
        if (data[classKey]) {
          setClassData(prev => ({ ...prev, ...data[classKey], gradeItems: data[classKey].gradeItems || [] }))
        } else {
          setIsEditing(true)
        }
      } else {
        setIsEditing(true)
      }
      setLoading(false)
    }
    fetchData()
  }, [currentUser, classKey])

  async function handleSave() {
    if (!classData.name.trim()) { alert('授業名を入力してください'); return }
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
            credits: classData.credits,
            memo: classData.memo.trim(),
            gradeItems: classData.gradeItems,
          }
        }
      })
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('保存に失敗しました')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`${day}曜${period}限の授業を削除しますか？`)) return
    const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().classes || {}
      delete data[classKey]
      await setDoc(ref, { classes: data })
    }
    navigate('/timetable')
  }

  // 成績項目を追加
  function addGradeItem() {
    if (!newGradeLabel.trim() || !newGradeWeight) return
    setClassData(prev => ({
      ...prev,
      gradeItems: [...prev.gradeItems, { label: newGradeLabel.trim(), weight: parseFloat(newGradeWeight) }]
    }))
    setNewGradeLabel('')
    setNewGradeWeight('')
  }

  // 成績項目を削除
  function removeGradeItem(index) {
    setClassData(prev => ({
      ...prev,
      gradeItems: prev.gradeItems.filter((_, i) => i !== index)
    }))
  }

  // 合計%
  const totalWeight = classData.gradeItems.reduce((sum, item) => sum + (item.weight || 0), 0)

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  const hasClass = classData.name.trim() !== ''

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/timetable')}>
          ← 時間割に戻る
        </button>
        <h2>{day}曜 {period}限</h2>
        <div className="header-right">
          {hasClass && !isEditing && (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>編集</button>
          )}
          {isEditing && hasClass && (
            <button className="delete-btn" onClick={handleDelete}>削除</button>
          )}
        </div>
      </header>

      <div className="detail-content">

        {/* ① 授業名 */}
        <section className="detail-section">
          <h3 className="section-title">📖 授業名</h3>
          {isEditing ? (
            <input
              className="input-field"
              value={classData.name}
              onChange={e => setClassData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例：英語コミュニケーション"
              autoFocus
            />
          ) : (
            <p className="info-text large">{classData.name || '未登録'}</p>
          )}
        </section>

        {/* ② 授業情報（教室・教授名・単位数） */}
        <section className="detail-section">
          <h3 className="section-title">🏫 授業情報</h3>
          {isEditing ? (
            <div className="input-stack">
              <div className="input-row">
                <div className="input-group">
                  <label>建物名</label>
                  <input className="input-field" value={classData.building}
                    onChange={e => setClassData(prev => ({ ...prev, building: e.target.value }))}
                    placeholder="例：A棟" />
                </div>
                <div className="input-group">
                  <label>教室番号</label>
                  <input className="input-field" value={classData.room}
                    onChange={e => setClassData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="例：301" />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>教授名</label>
                  <input className="input-field" value={classData.teacher}
                    onChange={e => setClassData(prev => ({ ...prev, teacher: e.target.value }))}
                    placeholder="例：山田 太郎" />
                </div>
                <div className="input-group">
                  <label>単位数</label>
                  <select className="input-field" value={classData.credits}
                    onChange={e => setClassData(prev => ({ ...prev, credits: e.target.value }))}>
                    <option value="">選択</option>
                    <option value="0.5">0.5</option>
                    <option value="1.0">1.0</option>
                    <option value="1.5">1.5</option>
                    <option value="2.0">2.0</option>
                    <option value="2.5">2.5</option>
                    <option value="3.0">3.0</option>
                    <option value="4.0">4.0</option>
                  </select>
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

        {/* ③ 成績評価の配分 */}
        <section className="detail-section">
          <h3 className="section-title">📊 成績評価の配分</h3>

          {/* 配分一覧 */}
          {classData.gradeItems.length > 0 ? (
            <div className="grade-items">
              {classData.gradeItems.map((item, i) => (
                <div key={i} className="grade-item">
                  <span className="grade-bar" style={{ width: `${item.weight}%` }} />
                  <span className="grade-label">{item.label}</span>
                  <span className="grade-weight">{item.weight}%</span>
                  {isEditing && (
                    <button className="grade-remove" onClick={() => removeGradeItem(i)}>✕</button>
                  )}
                </div>
              ))}
              {/* 合計 */}
              <div className={`grade-total ${totalWeight === 100 ? 'ok' : totalWeight > 100 ? 'over' : 'under'}`}>
                合計：{totalWeight}%
                {totalWeight === 100 && ' ✓'}
                {totalWeight !== 100 && ` （あと${100 - totalWeight}%）`}
              </div>
            </div>
          ) : (
            <p className="no-data">未登録</p>
          )}

          {/* 追加フォーム */}
          {isEditing && (
            <div className="grade-add-form">
              <input
                className="input-field"
                value={newGradeLabel}
                onChange={e => setNewGradeLabel(e.target.value)}
                placeholder="項目名（例：定期試験）"
              />
              <div className="grade-add-row">
                <input
                  className="input-field"
                  type="number"
                  value={newGradeWeight}
                  onChange={e => setNewGradeWeight(e.target.value)}
                  placeholder="%"
                  min="1" max="100"
                />
                <button className="grade-add-btn" onClick={addGradeItem}>追加</button>
              </div>
            </div>
          )}

          {/* 成績計算機 */}
          {classData.gradeItems.length > 0 && !isEditing && (
            <GradeCalculator gradeItems={classData.gradeItems} />
          )}
        </section>

        {/* ④ メモ */}
        <section className="detail-section">
          <h3 className="section-title">📝 メモ</h3>
          {isEditing ? (
            <textarea
              className="textarea-field"
              value={classData.memo}
              onChange={e => setClassData(prev => ({ ...prev, memo: e.target.value }))}
              placeholder="持ち物、先生からの連絡、課題・提出期限など"
              rows={4}
            />
          ) : (
            <div className="memo-display">
              {classData.memo
                ? <p className="memo-text">{classData.memo}</p>
                : <p className="no-data">メモなし</p>
              }
            </div>
          )}
        </section>

        {/* 保存ボタン */}
        {isEditing && (
          <div className="action-row">
            {hasClass && (
              <button className="cancel-btn" onClick={() => setIsEditing(false)} disabled={saving}>
                キャンセル
              </button>
            )}
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        )}

        {saved && <div className="saved-toast">✓ 保存しました</div>}

        {/* 出欠管理へのリンク */}
        {hasClass && !isEditing && (
          <button className="feature-btn" onClick={() => navigate(`/class/${day}/${period}/attendance`)}>
            📋 出欠状況を管理する
          </button>
        )}
      </div>
    </div>
  )
}

// ===== 成績計算機コンポーネント =====
function GradeCalculator({ gradeItems }) {
  const [scores, setScores] = useState({})

  // 各項目の取得点を入力
  function handleScore(label, value) {
    setScores(prev => ({ ...prev, [label]: value }))
  }

  // 合計スコアを計算
  const totalScore = gradeItems.reduce((sum, item) => {
    const score = parseFloat(scores[item.label] || 0)
    // 各項目：(取得点/100) × 配分%
    return sum + (score / 100) * item.weight
  }, 0)

  return (
    <div className="grade-calculator">
      <p className="calc-title">🧮 成績計算機</p>
      <p className="calc-desc">各項目で何点取れそうか入力すると、総合評価の見込みが計算されます</p>
      {gradeItems.map((item, i) => (
        <div key={i} className="calc-row">
          <span className="calc-label">{item.label}（{item.weight}%）</span>
          <div className="calc-input-wrap">
            <input
              type="number"
              className="calc-input"
              value={scores[item.label] || ''}
              onChange={e => handleScore(item.label, e.target.value)}
              placeholder="0"
              min="0"
              max="100"
            />
            <span className="calc-unit">点</span>
          </div>
          <span className="calc-partial">
            → {((parseFloat(scores[item.label] || 0) / 100) * item.weight).toFixed(1)}点分
          </span>
        </div>
      ))}
      <div className="calc-total">
        総合評価の見込み：<strong>{totalScore.toFixed(1)}点</strong>
      </div>
    </div>
  )
}
