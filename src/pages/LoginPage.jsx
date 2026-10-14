import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
        navigate('/')
      } else {
        if (password.length < 6) {
          setError('パスワードは6文字以上にしてください')
          setLoading(false)
          return
        }
        await signup(email, password)
        // 新規登録はセットアップ画面へ
        navigate('/setup')
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスはすでに登録されています')
      } else if (err.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません')
      } else {
        setError('エラーが発生しました。もう一度お試しください')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>📚 easy unipa</h1>
        <p className="login-subtitle">大学授業情報管理アプリ</p>

        <div className="login-tabs">
          <button
            className={`tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError('') }}
          >
            ログイン
          </button>
          <button
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError('') }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@university.ac.jp"
              required
            />
          </div>
          <div className="form-group">
            <label>パスワード{!isLogin && '（6文字以上）'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '処理中...' : isLogin ? 'ログイン' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
