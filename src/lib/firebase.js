import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDA8BFh3hjfdUf3uD-DjTt94lAzK9V_9Yc",
  authDomain: "lgpi-notes.firebaseapp.com",
  projectId: "lgpi-notes",
  storageBucket: "lgpi-notes.firebasestorage.app",
  messagingSenderId: "230241902566",
  appId: "1:230241902566:web:b8b62a98a07d3e3dbf4027"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export const TYPES = [
  { id: 'procedure', label: 'Procédure', emoji: '📋', bg: '#E8F4FD', color: '#1A7FAA' },
  { id: 'astuce',    label: 'Astuce',    emoji: '💡', bg: '#FFF9E6', color: '#996600' },
  { id: 'attention', label: 'Attention', emoji: '⚠️', bg: '#FFF0F0', color: '#CC0022' },
  { id: 'info',      label: 'Info',      emoji: 'ℹ️', bg: '#EEF2FF', color: '#5048CC' },
]

export const EMOJIS = ['📦','🧾','📡','👥','🔐','🔢','💳','📋','⚙️','📁','🏥','💊','🔬','📊','💻','🗂️','📝','🔑','🛡️','📌']

export const COLORS = [
  { bg: '#E0FAF2', tc: '#1A8C6A' },
  { bg: '#FFF4DC', tc: '#996600' },
  { bg: '#EDE9FF', tc: '#5048CC' },
  { bg: '#FFE8EE', tc: '#CC3355' },
  { bg: '#FFE9DC', tc: '#CC5500' },
  { bg: '#DCF2FC', tc: '#1A7FAA' },
  { bg: '#EDFCE8', tc: '#2D7A0A' },
  { bg: '#F0F0F0', tc: '#444'    },
  { bg: '#FDE8FF', tc: '#8B00AA' },
  { bg: '#FFF0E8', tc: '#A04000' },
]

export const ACCENT_COLORS = [
  { name: 'Violet',  hex: '#6C63FF' },
  { name: 'Rose',    hex: '#FF6584' },
  { name: 'Vert',    hex: '#43D9AD' },
  { name: 'Orange',  hex: '#FF8C42' },
  { name: 'Bleu',    hex: '#3B82F6' },
  { name: 'Indigo',  hex: '#4F46E5' },
]

export const DEFAULT_SCHEDULE = {
  1: { slots: [{ s: '08:30', e: '12:30' }, { s: '14:00', e: '17:30' }] },
  2: { slots: [{ s: '08:30', e: '12:30' }, { s: '14:00', e: '17:30' }] },
  3: { slots: [{ s: '09:00', e: '12:00' }, { s: '14:00', e: '18:30' }] },
  4: { slots: [{ s: '09:00', e: '12:00' }, { s: '14:00', e: '18:30' }] },
  5: {
    typeA: [{ s: '08:30', e: '12:30' }, { s: '14:00', e: '17:30' }],
    typeB: [{ s: '09:00', e: '12:00' }, { s: '14:00', e: '18:30' }],
  },
}
