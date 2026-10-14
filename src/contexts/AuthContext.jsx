import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 新規登録
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  // ログイン
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // ログアウト
  function logout() {
    return signOut(auth)
  }

  // ログイン状態の監視（ページをリロードしても維持される）
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = { currentUser, signup, login, logout }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
