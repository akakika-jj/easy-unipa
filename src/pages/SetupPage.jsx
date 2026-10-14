import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import './SetupPage.css'

const DAYS = ['月', '火', '水', '木', '金', '土']
const PERIODS = [1, 2, 3, 4, 5] // 5限まで

// AIへのお願い文サンプル
const AI_PROMPT_SAMPLE = `大学のシラバスに登録されている時間割表の画像を送ります。
この画像を見て、各授業を以下の形式で1行ずつテキストにまとめてください。

形式：
月1 英語コミュニケーション A301 山田太郎 単位数:2.0

ルール：
① 曜日は「月火水木金土」の漢字1文字で書いてください
② 授業が入っていないコマは書かなくてOKです
③ 授業名・教室・教授名・単位数はシラバスに表示されているそのままの内容で書いてください
④ 教室や教授名・単位数が不明な場合は省略してOKです（授業名だけでも可）`

// テキストを解析して時間割データに変換
// 形式：「月1 授業名 教室 教授名 単位数」（教室以降は省略可）
function parseScheduleText(text) {
  const result = {}
  const errors = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '')

  for (const line of lines) {
    // 曜日＋限目＋スペース（全角・半角どちらでもOK）＋残り
    const match = line.match(/^([月火水木金土])([1-5])[\s　]+(.+)$/)
    if (!match) {
      errors.push(`「${line}」は認識できませんでした（例：月1 英語 A301 山田太郎 2.0）`)
      continue
    }
    const day = match[1]
    const period = parseInt(match[2])
    const rest = match[3].trim().split(/\s+/)

    // 最初のトークンが授業名、以降は教室・教授名・単位数（省略可）
    const name = rest[0] || ''
    const room = rest[1] || ''
    const teacher = rest[2] || ''
    // 単位数：「単位数:2.0」または単純な数字トークンを探す
    const creditsToken = rest.find((t, i) => i >= 1 && /^単位数[:：]?\d+(\.\d+)?$/.test(t))
    const creditsNum = creditsToken
      ? creditsToken.replace(/^単位数[:：]?/, '')
      : (rest.find((t, i) => i >= 1 && /^\d+(\.\d+)?$/.test(t)) || '')
    const credits = creditsNum

    const key = `${day}_${period}`
    result[key] = { name, room, building: '', teacher, credits, memo: '' }
  }

  return { result, errors }
}

export default function SetupPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('paste')
  const [manual, setManual] = useState({})
  const [copied, setCopied] = useState(false)

  // AIお願い文をコピー
  function handleCopyPrompt() {
    navigator.clipboard.writeText(AI_PROMPT_SAMPLE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePreview() {
    const { result, errors } = parseScheduleText(text)
    setPreview(result)
    setErrors(errors)
  }

  function handleEditPreview(key, value) {
    setPreview(prev => ({ ...prev, [key]: { ...prev[key], name: value } }))
  }

  function handleRemovePreview(key) {
    setPreview(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleManualChange(day, period, value) {
    const key = `${day}_${period}`
    setManual(prev => ({
      ...prev,
      [key]: value ? { name: value, room: '', building: '', memo: '' } : undefined
    }))
  }

  async function handleSave() {
    setSaving(true)
    const classes = mode === 'paste'
      ? preview
      : Object.fromEntries(
          Object.entries(manual)
            .filter(([, v]) => v && v.name.trim())
            .map(([k, v]) => [k, { ...v, name: v.name.trim() }])
        )

    if (!classes || Object.keys(classes).length === 0) {
      alert('授業が1つも登録されていません')
      setSaving(false)
      return
    }

    try {
      const ref = doc(db, 'users', currentUser.uid, 'data', 'timetable')
      await setDoc(ref, { classes })
      navigate('/')
    } catch (e) {
      alert('保存に失敗しました')
    }
    setSaving(false)
  }

  function handleSkip() {
    navigate('/')
  }

  return (
    <div className="setup-page">
      <header className="setup-header">
        <h1>📚 easy unipa</h1>
        <p>時間割を設定しましょう</p>
      </header>

      <div className="setup-content">
        {/* モード切り替え */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'paste' ? 'active' : ''}`}
            onClick={() => setMode('paste')}
          >
            📋 テキストから一括登録
          </button>
          <button
            className={`mode-tab ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            ✏️ 手入力で登録
          </button>
        </div>

        {/* テキスト貼り付けモード */}
        {mode === 'paste' && (
          <div className="paste-mode">

            {/* ★ AIヒントボックス（強調） */}
            <div className="ai-hint-box">
              <div className="ai-hint-header">
                <span className="ai-hint-icon">🤖</span>
                <span className="ai-hint-title">AIを使うと30秒で時間割を登録できます！</span>
              </div>
              <p className="ai-hint-body">
                大学のシラバスに登録されている<strong>時間割表のスクリーンショット</strong>をChatGPT・Gemini・ClaudeなどのAIに送り、下のお願い文をコピーして一緒に送ってください。AIが自動でテキストにまとめてくれます。
              </p>
              <div className="ai-prompt-box">
                <div className="ai-prompt-label">
                  📋 プロンプト用（コピーして使ってください）
                </div>
                <pre className="ai-prompt-text">{AI_PROMPT_SAMPLE}</pre>
                <button className="copy-btn" onClick={handleCopyPrompt}>
                  {copied ? '✓ コピーしました！' : '📋 コピーする'}
                </button>
              </div>
            </div>

            <textarea
              className="paste-area"
              value={text}
              onChange={e => { setText(e.target.value); setPreview(null) }}
              placeholder={'AIが出力したテキスト、または手入力したテキストを貼り付けてください\n\n例：\n月1 英語コミュニケーション\n月2 経営学入門\n火1 統計学'}
              rows={8}
            />

            <button className="preview-btn" onClick={handlePreview} disabled={!text.trim()}>
              プレビューを確認する →
            </button>

            {errors.length > 0 && (
              <div className="error-box">
                <p className="error-title">⚠️ 認識できなかった行</p>
                {errors.map((e, i) => <p key={i} className="error-item">{e}</p>)}
              </div>
            )}

            {preview && (
              <div className="preview-section">
                <p className="preview-title">✅ 配置プレビュー（修正・削除できます）</p>
                <div className="preview-grid">
                  {Object.entries(preview)
                    .sort(([a], [b]) => {
                      const dayOrder = ['月', '火', '水', '木', '金', '土']
                      const [dayA, pA] = [a[0], parseInt(a[2])]
                      const [dayB, pB] = [b[0], parseInt(b[2])]
                      return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB) || pA - pB
                    })
                    .map(([key, val]) => (
                      <div key={key} className="preview-item">
                        <span className="preview-label">{key[0]}曜{key[2]}限</span>
                        <input
                          className="preview-input"
                          value={val.name}
                          onChange={e => handleEditPreview(key, e.target.value)}
                        />
                        <button className="preview-remove" onClick={() => handleRemovePreview(key)}>✕</button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 手入力モード */}
        {mode === 'manual' && (
          <div className="manual-mode">
            <div className="manual-grid">
              <div className="manual-corner" />
              {DAYS.map(d => (
                <div key={d} className="manual-day-header">{d}</div>
              ))}
              {PERIODS.map(p => (
                <>
                  <div key={`p${p}`} className="manual-period-label">{p}限</div>
                  {DAYS.map(d => (
                    <input
                      key={`${d}_${p}`}
                      className="manual-cell"
                      value={manual[`${d}_${p}`]?.name || ''}
                      onChange={e => handleManualChange(d, p, e.target.value)}
                      placeholder="授業名"
                    />
                  ))}
                </>
              ))}
            </div>
          </div>
        )}

        <div className="setup-actions">
          <button className="skip-btn" onClick={handleSkip}>後で設定する</button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving || (mode === 'paste' && !preview)}
          >
            {saving ? '保存中...' : '時間割を保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
