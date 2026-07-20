import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { clearLegacyStorage } from './shared/data/clearLegacyStorage'
import { useAuthStore } from './shared/store/authStore'
import './styles/global.css'

// 上线前清理旧的 localStorage 数据（notes/snapshots 已迁到后端）
// 只清一次，保留 searchHistory 和 auth token
clearLegacyStorage()

useAuthStore.getState().hydrate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
