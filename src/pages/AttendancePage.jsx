import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import './AttendancePage.css'

const STATUS_OPTIONS = [
  { value: 'present', label: '○', desc: '出席', color: '#38a169' },
  { value: 'excused', label: '✅', desc: '理由付き欠席', color: '#3182ce' },
  { value: 'late', label: '△', desc: '遅刻', color: '#d69e2e' },
  { value: 'absent', label: '×', desc: '欠席', color: '#e53e3e' },
]

const EXCUSE_OPTIONS = ['病欠', '部活', '就職活動', 'その他']

export default function AttendancePage() {
  const { day, period } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [className, setClassName] = useState('')
  const [records, setRecords] = useState([]) // [{date, status, excuse, excuseNote}]
  const [gradeInfo, setGradeInfo] = useState({ attendanceWeight: '', totalClasses: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 新規記録追加用
  const [newDate, setNewDate] = useState('')
  const [newStatus, setNewStatus] = useState('present')
  const [newExcuse, setNewExcuse] = useState('病欠')
  const [newExcuseNote, setNewExcuseNote] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)

  const classKey = `${day}_${period}`

  useEffect(() => {
    async function fetchData() {
      const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data().classes || {}
        if (data[classKey]) {
          setClassName(data[classKey].name || '')
          setRecords(data[classKey].attendance || [])
          setGradeInfo({
            attendanceWeight: data[classKey].attendanceWeight || '',
            totalClasses: data[classKey].totalClasses || '',
          })
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [currentUser, classKey])

  // 出欠集計
  const counts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const presentCount = counts['present'] || 0
  const excusedCount = counts['excused'] || 0
  const lateCount = counts['late'] || 0
  const absentCount = counts['absent'] || 0
  const totalRecorded = records.length

  // 出席率（出席＋遅刻を出席扱いにする）
  const attendanceRate = totalRecorded > 0
    ? Math.round(((presentCount + lateCount) / totalRecorded) * 100)
    : null

  // 成績への影響計算
  const gradeImpact = gradeInfo.attendanceWeight && attendanceRate !== null
    ? Math.round((attendanceRate / 100) * parseFloat(gradeInfo.attendanceWeight))
    : null

  // 記録を保存
  async function saveRecords(newRecords, newGradeInfo) {
    setSaving(true)
    try {
      const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
      const snap = await getDoc(ref)
      const existing = snap.exists() ? (snap.data().classes || {}) : {}
      await setDoc(ref, {
        classes: {
          ...existing,
          [classKey]: {
            ...existing[classKey],
            attendance: newRecords,
            attendanceWeight: newGradeInfo?.attendanceWeight ?? gradeInfo.attendanceWeight,
            totalClasses: newGradeInfo?.totalClasses ?? gradeInfo.totalClasses,
          }
        }
      })
    } catch (e) {
      alert('保存に失敗しました')
    }
    setSaving(false)
  }

  // 記録を追加
  async function handleAdd() {
    if (!newDate) { alert('日付を選択してください'); return }
    const record = {
      date: newDate,
      status: newStatus,
      excuse: newStatus === 'excused' ? newExcuse : '',
      excuseNote: newStatus === 'excused' ? newExcuseNote : '',
    }
    const updated = [...records, record].sort((a, b) => a.date.localeCompare(b.date))
    setRecords(updated)
    await saveRecords(updated)
    setNewDate('')
    setNewStatus('present')
    setNewExcuseNote('')
  }

  // 記録を削除
  async function handleDelete(index) {
    const updated = records.filter((_, i) => i !== index)
    setRecords(updated)
    await saveRecords(updated)
  }

  // 成績設定を保存
  async function handleSaveGrade() {
    await saveRecords(records, gradeInfo)
    alert('保存しました')
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="attendance-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/class/${day}/${period}`)}>
          ← 授業詳細に戻る
        </button>
        <h2>{className || `${day}曜${period}限`} - 出欠管理</h2>
      </header>

      <div className="attendance-content">

        {/* 集計カード */}
        <section className="att-section">
          <h3 className="section-title">📊 出欠集計</h3>
          <div className="count-grid">
            <div className="count-card present">
              <span className="count-symbol">○</span>
              <span className="count-num">{presentCount}</span>
              <span className="count-label">出席</span>
            </div>
            <div className="count-card excused">
              <span className="count-symbol">✅</span>
              <span className="count-num">{excusedCount}</span>
              <span className="count-label">理由付き</span>
            </div>
            <div className="count-card late">
              <span className="count-symbol">△</span>
              <span className="count-num">{lateCount}</span>
              <span className="count-label">遅刻</span>
            </div>
            <div className="count-card absent">
              <span className="count-symbol">×</span>
              <span className="count-num">{absentCount}</span>
              <span className="count-label">欠席</span>
            </div>
          </div>
          {attendanceRate !== null && (
            <div className="rate-bar-wrap">
              <div className="rate-label">出席率（出席＋遅刻）：<strong>{attendanceRate}%</strong></div>
              <div className="rate-bar">
                <div className="rate-fill" style={{ width: `${attendanceRate}%` }} />
              </div>
            </div>
          )}
        </section>

        {/* 成績への影響 */}
        <section className="att-section">
          <h3 className="section-title">🎯 成績への影響</h3>
          <div className="grade-inputs">
            <div className="grade-input-group">
              <label>出席点の配分（%）</label>
              <input
                type="number"
                className="grade-input"
                value={gradeInfo.attendanceWeight}
                onChange={e => setGradeInfo(prev => ({ ...prev, attendanceWeight: e.target.value }))}
                placeholder="例：20"
                min="0"
                max="100"
              />
            </div>
            <div className="grade-input-group">
              <label>全授業回数（予定）</label>
              <input
                type="number"
                className="grade-input"
                value={gradeInfo.totalClasses}
                onChange={e => setGradeInfo(prev => ({ ...prev, totalClasses: e.target.value }))}
                placeholder="例：15"
                min="1"
              />
            </div>
          </div>
          <button className="save-grade-btn" onClick={handleSaveGrade} disabled={saving}>
            設定を保存
          </button>

          {gradeImpact !== null && (
            <div className="impact-card">
              <p>現在の出席状況で獲得できる出席点の見込み</p>
              <div className="impact-value">
                <span className="impact-num">{gradeImpact}</span>
                <span className="impact-unit">/ {gradeInfo.attendanceWeight} 点</span>
              </div>
              <p className="impact-note">
                出席率 {attendanceRate}% × 出席点 {gradeInfo.attendanceWeight}% = {gradeImpact}点分
              </p>
            </div>
          )}
        </section>

        {/* 新規記録追加 */}
        <section className="att-section">
          <h3 className="section-title">➕ 出欠を記録する</h3>
          <div className="add-form">
            <div className="add-row">
              <div className="add-group">
                <label>日付</label>
                <input
                  type="date"
                  className="date-input"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                />
              </div>
              <div className="add-group">
                <label>状態</label>
                <div className="status-buttons">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      className={`status-btn ${newStatus === s.value ? 'selected' : ''}`}
                      style={newStatus === s.value ? { background: s.color, color: 'white', borderColor: s.color } : {}}
                      onClick={() => setNewStatus(s.value)}
                      title={s.desc}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {newStatus === 'excused' && (
              <div className="excuse-row">
                <div className="add-group">
                  <label>理由</label>
                  <select
                    className="excuse-select"
                    value={newExcuse}
                    onChange={e => setNewExcuse(e.target.value)}
                  >
                    {EXCUSE_OPTIONS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="add-group flex-1">
                  <label>補足メモ</label>
                  <input
                    className="excuse-note"
                    value={newExcuseNote}
                    onChange={e => setNewExcuseNote(e.target.value)}
                    placeholder="任意"
                  />
                </div>
              </div>
            )}

            <button className="add-btn" onClick={handleAdd} disabled={saving}>
              記録を追加
            </button>
          </div>
        </section>

        {/* 記録一覧 */}
        <section className="att-section">
          <h3 className="section-title">📋 記録一覧（{records.length}件）</h3>
          {records.length === 0 ? (
            <p className="no-data">まだ記録がありません</p>
          ) : (
            <div className="records-list">
              {[...records].reverse().map((r, i) => {
                const origIndex = records.length - 1 - i
                const statusOpt = STATUS_OPTIONS.find(s => s.value === r.status)
                return (
                  <div key={i} className="record-item">
                    <span className="record-date">{r.date}</span>
                    <span
                      className="record-status"
                      style={{ color: statusOpt?.color }}
                    >
                      {statusOpt?.label} {statusOpt?.desc}
                    </span>
                    {r.status === 'excused' && (
                      <span className="record-excuse">{r.excuse}{r.excuseNote ? `（${r.excuseNote}）` : ''}</span>
                    )}
                    <button className="delete-record-btn" onClick={() => handleDelete(origIndex)}>削除</button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
