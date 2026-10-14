// =====================================================
// Firebase設定ファイル
// Firebaseコンソール（console.firebase.google.com）で
// プロジェクトを作成後、ここの値を書き換えてください
// =====================================================
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDcUHW5pzeOeGzVFQZJxB1K_TIUjQLTuyc",
  authDomain: "easy-unipa.firebaseapp.com",
  projectId: "easy-unipa",
  storageBucket: "easy-unipa.firebasestorage.app",
  messagingSenderId: "807646995151",
  appId: "1:807646995151:web:cf185e00a8df4bfa110dba",
  measurementId: "G-7EJNK621JS"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
